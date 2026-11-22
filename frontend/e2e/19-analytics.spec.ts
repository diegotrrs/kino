import { type Page, type Request, expect, test } from '@playwright/test';
import { gunzipSync } from 'node:zlib';
import { createCalendar, deleteUserById, getToken, login, resetTestData } from './helpers/api';

// Analytics only runs with a PostHog token. CI and normal local runs have none, so @19.1 runs there. To run
// @19.2+, start the dev server with a dummy NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN in .env.local and run this file
// on its own (with a token, the banner would sit over every other spec's pages).
const hasAnalyticsToken = !!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

// PostHog drops events it thinks come from bots: headless Chrome's user agent, its client-hint brands
// (navigator.userAgentData) and navigator.webdriver. The consent tests present an ordinary browser on all three;
// the app itself keeps PostHog's bot filter on.
const DESKTOP_CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';
const MOBILE_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36';

type CapturedEvent = { event: string; properties: Record<string, unknown> };
type PostHogTraffic = { events: string[]; requests: string[]; captured: CapturedEvent[] };

// PostHog gzips what it sends; this unpacks a request into its events
const readEvents = (request: Request): { raw: string; events: CapturedEvent[] } => {
  const body = request.postDataBuffer();
  if (!body) {
    return { raw: '', events: [] };
  }
  const isGzip = body[0] === 0x1f && body[1] === 0x8b;
  const raw = (isGzip ? gunzipSync(body) : body).toString('utf8');
  try {
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : (parsed as { batch?: unknown[] }).batch ?? [parsed];
    return { raw, events: list.filter((item): item is CapturedEvent => !!item && typeof item === 'object' && 'event' in item) };
  } catch {
    return { raw, events: [] };
  }
};

const getUserIdFromSession = async (page: Page): Promise<number> => {
  const token = (await page.context().cookies()).find((cookie) => cookie.name === 'token')?.value ?? '';
  return Number(JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub);
};

const getEventNames = (traffic: PostHogTraffic): string[] => traffic.captured.map((captured) => captured.event);

// The shared login helper reloads straight after login (to force English), which can drop PostHog's queued batch
// in the test browser, so these tests log in through the form without it
const logInThroughForm = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_TEST_EMAIL ?? '');
  await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_TEST_PASSWORD ?? '');
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL('/home');
};

// Answers every PostHog request locally, so nothing leaves the machine, and records what would have been sent
const interceptPostHog = async (page: Page): Promise<PostHogTraffic> => {
  const traffic: PostHogTraffic = { events: [], requests: [], captured: [] };
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'userAgentData', {
      get: () => ({
        brands: [{ brand: 'Google Chrome', version: '138' }, { brand: 'Chromium', version: '138' }],
        mobile: false,
        platform: 'macOS',
        getHighEntropyValues: async () => ({}),
      }),
    });
  });
  await page.route(/posthog\.com/, async (route) => {
    const request = route.request();
    traffic.requests.push(`${request.method()} ${new URL(request.url()).pathname}`);
    if (request.method() === 'POST') {
      const { raw, events } = readEvents(request);
      traffic.events.push(raw);
      traffic.captured.push(...events);
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  return traffic;
};

// PostHog's own identity storage (the "ph_<token>_posthog" cookie or localStorage entry), not the
// record of the visitor's choice itself
const getPostHogIdentityStorage = async (page: Page): Promise<string[]> => {
  const cookies = (await page.context().cookies()).map((cookie) => cookie.name);
  const storage = await page.evaluate(() => Object.keys(window.localStorage));
  return [...cookies, ...storage].filter((name) => /^ph_.*_posthog$/.test(name));
};

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.describe('@19. analytics', () => {
  test('@19.1 should send nothing to analytics when no PostHog token is configured', async ({ page, request }) => {
    test.skip(hasAnalyticsToken, 'A PostHog token is configured');
    const analyticsRequests: string[] = [];
    page.on('request', (req) => {
      if (new URL(req.url()).hostname.endsWith('posthog.com')) {
        analyticsRequests.push(req.url());
      }
    });

    // A visitor's landing page, then a logged-in session through a calendar
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Usage analytics' })).toHaveCount(0);
    await login(page);
    const calendarUuid = await createCalendar(request, await getToken(request), `Analytics Off Test ${Date.now()}`);
    await page.goto(`/calendars/${calendarUuid}`);
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    expect(analyticsRequests).toEqual([]);
  });
});

test.describe('@19. analytics consent', () => {
  test.skip(!hasAnalyticsToken, 'Needs a (dummy) PostHog token; see the note at the top of this file');
  test.use({ userAgent: DESKTOP_CHROME });

  test('@19.2 should ask for consent and send or store nothing before the visitor answers', async ({ page }) => {
    const traffic = await interceptPostHog(page);

    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Usage analytics' })).toBeVisible();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    expect(traffic.events).toEqual([]);
    expect(await getPostHogIdentityStorage(page)).toEqual([]);
  });

  test('@19.3 should start analytics after Accept and not ask again', async ({ page }) => {
    const traffic = await interceptPostHog(page);

    await page.goto('/');
    await page.getByRole('region', { name: 'Usage analytics' }).getByRole('button', { name: 'Accept' }).click();
    await expect(page.getByRole('region', { name: 'Usage analytics' })).toHaveCount(0);
    await page.goto('/login');

    await expect.poll(() => traffic.events.length).toBeGreaterThan(0);
    expect(await getPostHogIdentityStorage(page)).not.toEqual([]);
    await page.reload();
    await expect(page.getByRole('region', { name: 'Usage analytics' })).toHaveCount(0);
  });

  test('@19.4 should store nothing after Decline and not ask again', async ({ page }) => {
    await interceptPostHog(page);

    await page.goto('/');
    await page.getByRole('region', { name: 'Usage analytics' }).getByRole('button', { name: 'Decline' }).click();
    await expect(page.getByRole('region', { name: 'Usage analytics' })).toHaveCount(0);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    expect(await getPostHogIdentityStorage(page)).toEqual([]);
    await page.reload();
    await expect(page.getByRole('region', { name: 'Usage analytics' })).toHaveCount(0);
  });

  test('@19.5 should let a member change their choice in Settings', async ({ page }) => {
    await interceptPostHog(page);
    await page.goto('/');
    await page.getByRole('region', { name: 'Usage analytics' }).getByRole('button', { name: 'Decline' }).click();
    await login(page);

    await page.goto('/settings');
    const setting = page.getByRole('switch', { name: 'Usage analytics' });
    await expect(setting).not.toBeChecked();
    await setting.click();
    await expect(setting).toBeChecked();
    await page.reload();
    await expect(page.getByRole('switch', { name: 'Usage analytics' })).toBeChecked();
    expect(await getPostHogIdentityStorage(page)).not.toEqual([]);
  });
});

test.describe('@19. analytics identity', () => {
  test.skip(!hasAnalyticsToken, 'Needs a (dummy) PostHog token; see the note at the top of this file');
  test.use({ userAgent: DESKTOP_CHROME });

  test('@19.7 should identify a member by id after login, and forget them after log-out', async ({ page }) => {
    const traffic = await interceptPostHog(page);
    await page.goto('/');
    await page.getByRole('region', { name: 'Usage analytics' }).getByRole('button', { name: 'Accept' }).click();

    await logInThroughForm(page);
    const userId = await getUserIdFromSession(page);
    await expect.poll(() => getEventNames(traffic)).toContain('user_logged_in');
    const identify = traffic.captured.find((captured) => captured.event === '$identify');
    expect(identify?.properties.distinct_id).toBe(String(userId));
    // The hand-off cookie is used once
    expect((await page.context().cookies()).map((cookie) => cookie.name)).not.toContain('kino_auth_event');
    // Never the member's email or name
    expect(traffic.events.join('\n')).not.toContain(process.env.E2E_TEST_EMAIL ?? '@');

    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect.poll(() => getEventNames(traffic)).toContain('user_logged_out');
    const loggedOut = traffic.captured.find((captured) => captured.event === 'user_logged_out');
    expect(loggedOut?.properties.distinct_id).toBe(String(userId));
    // The next person on this device starts anonymous
    const distinctIdNow = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').distinct_id, `ph_${process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}_posthog`);
    expect(distinctIdNow).not.toBe(String(userId));
  });

  test('@19.8 should record a sign-up and where it came from', async ({ page, request }) => {
    const traffic = await interceptPostHog(page);
    await page.goto('/');
    await page.getByRole('region', { name: 'Usage analytics' }).getByRole('button', { name: 'Accept' }).click();

    const email = `e2e+analytics+${Date.now()}@kino.com`;
    await page.goto(`/signup?redirect=${encodeURIComponent('/calendars/create?trip=kyoto-in-autumn')}`);
    await page.getByLabel('Name').fill('Analytics Signup');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('securepassword123');
    await page.getByLabel('Confirm password').fill('securepassword123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/calendars\/create/);
    const userId = await getUserIdFromSession(page);

    try {
      await expect.poll(() => getEventNames(traffic)).toContain('user_signed_up');
      const signedUp = traffic.captured.find((captured) => captured.event === 'user_signed_up');
      expect(signedUp?.properties).toMatchObject({ source: 'hot_trip', distinct_id: String(userId) });
      expect(traffic.events.join('\n')).not.toContain(email);
      expect(traffic.events.join('\n')).not.toContain('Analytics Signup');
    } finally {
      await deleteUserById(request, userId);
    }
  });
});

test.describe('@19. analytics consent on phones', () => {
  test.skip(!hasAnalyticsToken, 'Needs a (dummy) PostHog token; see the note at the top of this file');
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, userAgent: MOBILE_CHROME });

  test('@19.6 should show the banner in the selected language and fit a phone', async ({ page }) => {
    await interceptPostHog(page);
    await page.context().addCookies([{ name: 'locale', value: 'pt', domain: 'localhost', path: '/' }]);

    await page.goto('/');
    const banner = page.getByRole('region', { name: 'Estatísticas de utilização' });
    await expect(banner.getByRole('button', { name: 'Aceitar' })).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Recusar' })).toBeVisible();
    const box = await banner.boundingBox();
    expect(box && box.x >= 0 && box.x + box.width <= 390).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
