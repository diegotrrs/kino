import { expect, test } from '@playwright/test';
import {
  createCalendar,
  createEvent,
  createEventCost,
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

test.describe('@11. trip cost summary', () => {
  test('@11.1 should not show the cost pill when a calendar has no costs', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `No Costs Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];
    await createEvent(request, token, calendarId, 'Free Event', today);

    await page.goto(`/calendars/${calendarUuid}`);
    await expect(page.getByTestId('trip-cost-pill')).not.toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.2 should show the cost pill with totals when costs exist', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Cost Pill Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Hotel', today);
    await createEventCost(request, token, eventId, 'Room', 120, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await expect(page.getByTestId('trip-cost-pill')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('trip-cost-pill')).toContainText('£120.00');

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.3 should open the drawer and show per-currency totals', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Drawer Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];
    const eventId1 = await createEvent(request, token, calendarId, 'Flight', today);
    await createEventCost(request, token, eventId1, 'Return ticket', 240, 'GBP');
    const eventId2 = await createEvent(request, token, calendarId, 'Hotel', today);
    await createEventCost(request, token, eventId2, 'Nights 1–3', 450, 'EUR');
    await createEventCost(request, token, eventId2, 'Breakfast', 45, 'EUR');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByTestId('trip-cost-pill').click();

    const drawer = page.getByTestId('trip-cost-drawer');
    await expect(drawer).toBeVisible();
    await expect(page.getByTestId('trip-total-GBP')).toContainText('£240.00');
    await expect(page.getByTestId('trip-total-EUR')).toContainText('€495.00');

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.4 should show the event breakdown inside the drawer', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Breakdown Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Museum Visit', today);
    await createEventCost(request, token, eventId, 'Entry ticket', 18, 'EUR');
    await createEventCost(request, token, eventId, 'Audio guide', 8, 'EUR');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByTestId('trip-cost-pill').click();

    await expect(page.getByText('Museum Visit')).toBeVisible();
    await expect(page.getByText('Entry ticket')).toBeVisible();
    await expect(page.getByText('Audio guide')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.5 should close the drawer when clicking the backdrop', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Close Drawer Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Tour', today);
    await createEventCost(request, token, eventId, 'Ticket', 25, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByTestId('trip-cost-pill').click();
    await expect(page.getByTestId('trip-cost-drawer')).toBeVisible();

    page.getByRole('button', { name: 'Close trip budget' }).click();
    await expect(page.getByTestId('trip-cost-drawer')).not.toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.6 should aggregate costs across multiple events and currencies', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Multi-event Costs ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];

    const ev1 = await createEvent(request, token, calendarId, 'Flight', today);
    await createEventCost(request, token, ev1, 'Ticket', 200, 'GBP');
    const ev2 = await createEvent(request, token, calendarId, 'Taxi', today);
    await createEventCost(request, token, ev2, 'Airport transfer', 35, 'GBP');
    const ev3 = await createEvent(request, token, calendarId, 'Hotel', today);
    await createEventCost(request, token, ev3, 'Room', 300, 'EUR');

    await page.goto(`/calendars/${calendarUuid}`);

    const pill = page.getByTestId('trip-cost-pill');
    await expect(pill).toContainText('£235.00');
    await expect(pill).toContainText('€300.00');

    await pill.click();
    await expect(page.getByTestId('trip-total-GBP')).toContainText('£235.00');
    await expect(page.getByTestId('trip-total-EUR')).toContainText('€300.00');

    await deleteCalendar(request, token, calendarUuid);
  });
});
