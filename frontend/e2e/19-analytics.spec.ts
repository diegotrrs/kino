import { expect, test } from '@playwright/test';
import { createCalendar, getToken, login, resetTestData } from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.describe('@19. analytics', () => {
  test('@19.1 should send nothing to analytics when no PostHog token is configured', async ({ page, request }) => {
    const analyticsRequests: string[] = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.hostname.endsWith('posthog.com')) {
        analyticsRequests.push(req.url());
      }
    });

    // A visitor's landing page, then a logged-in session through a calendar
    await page.goto('/');
    await login(page);
    const calendarUuid = await createCalendar(request, await getToken(request), `Analytics Off Test ${Date.now()}`);
    await page.goto(`/calendars/${calendarUuid}`);
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    expect(analyticsRequests).toEqual([]);
  });
});
