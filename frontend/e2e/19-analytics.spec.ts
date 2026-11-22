import { type Page, expect, test } from '@playwright/test';
import { createCalendar, getToken, login, resetTestData } from './helpers/api';

// Analytics only runs with a PostHog token. CI and normal local runs have none, so @19.1 runs there. To run
// @19.2+, start the dev server with a dummy NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN in .env.local and run this file
// on its own (with a token, the banner would sit over every other spec's pages).
const hasAnalyticsToken = !!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

// PostHog drops events it thinks come from bots: headless Chrome's user agent, its client-hint brands
// (navigator.userAgentData) and navigator.webdriver. The consent tests present an ordinary browser on all three;
// the app itself keeps PostHog's bot filter on.
const DESKTOP_CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';
const MOBILE_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36';

type PostHogTraffic = { events: string[]; requests: string[] };

// Answers every PostHog request locally, so nothing leaves the machine, and records what would have been sent
const interceptPostHog = async (page: Page): Promise<PostHogTraffic> => {
  const traffic: PostHogTraffic = { events: [], requests: [] };
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
      traffic.events.push(request.postData() ?? '');
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
