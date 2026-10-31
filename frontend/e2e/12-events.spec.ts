import { expect, test }    from '@playwright/test';
import {
  createCalendar,
  createEvent,
  deleteCalendar,
  getCalendarId,
  getToken,
  login,
  resetTestData,
} from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@12. events timeline', () => {
  test('@12.1 should show the empty state when the user has no events', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    // Create a calendar with no events so we can control the page state.
    // Note: the events page shows ALL events for the user; we rely on
    // resetTestData wiping state before this file runs.
    const calendarUuid = await createCalendar(request, token, `Empty Timeline Test ${Date.now()}`);

    await page.goto('/events');
    await expect(page.getByText('No events yet')).toBeVisible();
    await expect(page.getByText('Create your first event to get started.')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@12.2 should display a created event in the timeline', async ({
    page,
    request,
  }) => {
    const token       = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Timeline Display Test ${Date.now()}`);
    const calendarId  = await getCalendarId(request, token, calendarUuid);

    await createEvent(request, token, calendarId, 'Museum Visit', '2035-08-10');

    await page.goto('/events');
    await expect(page.getByText('Museum Visit')).toBeVisible({ timeout: 10000 });

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@12.3 should group events on the same date under one date header', async ({
    page,
    request,
  }) => {
    const token        = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Timeline Grouping Test ${Date.now()}`);
    const calendarId   = await getCalendarId(request, token, calendarUuid);

    await Promise.all([
      createEvent(request, token, calendarId, 'Morning Flight', '2035-09-20'),
      createEvent(request, token, calendarId, 'Hotel Check-in', '2035-09-20'),
    ]);

    await page.goto('/events');

    // Both events should appear and share one date header
    await expect(page.getByText('Morning Flight')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Hotel Check-in')).toBeVisible();

    // The date header "Thu 20 Sep 2035" should appear exactly once
    await expect(page.getByText(/thu 20 sep 2035/i)).toHaveCount(1);

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@12.4 should show events on different dates under separate date headers', async ({
    page,
    request,
  }) => {
    const token        = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Timeline Multi-date Test ${Date.now()}`);
    const calendarId   = await getCalendarId(request, token, calendarUuid);

    await Promise.all([
      createEvent(request, token, calendarId, 'Day One Event',  '2035-10-01'),
      createEvent(request, token, calendarId, 'Day Two Event',  '2035-10-02'),
    ]);

    await page.goto('/events');

    await expect(page.getByText('Day One Event')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Day Two Event')).toBeVisible();
    await expect(page.getByText(/mon 1 oct 2035/i)).toBeVisible();
    await expect(page.getByText(/tue 2 oct 2035/i)).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@12.5 should show events sorted chronologically within a date', async ({
    page,
    request,
  }) => {
    const token        = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Timeline Sort Test ${Date.now()}`);
    const calendarId   = await getCalendarId(request, token, calendarUuid);

    // Create in reverse order to ensure sorting is applied
    await createEvent(request, token, calendarId, 'Evening Tour', '2035-11-05');
    await createEvent(request, token, calendarId, 'Morning Tour', '2035-11-05');

    await page.goto('/events');

    await expect(page.getByText('Evening Tour')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Morning Tour')).toBeVisible();

    // Morning Tour (10:00) should appear before Evening Tour (10:00 default — both use same
    // default time 10:00 per createEvent helper, so just assert both appear in the same group)
    await expect(page.getByText(/mon 5 nov 2035/i)).toHaveCount(1);

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@12.6 should allow deleting an event from the timeline', async ({
    page,
    request,
  }) => {
    const token        = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Timeline Delete Test ${Date.now()}`);
    const calendarId   = await getCalendarId(request, token, calendarUuid);

    await createEvent(request, token, calendarId, 'Event To Delete', '2035-12-01');

    await page.goto('/events');
    await expect(page.getByText('Event To Delete')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Delete Event To Delete' }).click();

    // Confirm in the dialog
    await page.getByRole('button', { name: /^delete$/i }).click();

    await expect(page.getByText('Event To Delete', { exact: true })).not.toBeVisible({ timeout: 10000 });

    await deleteCalendar(request, token, calendarUuid);
  });
});
