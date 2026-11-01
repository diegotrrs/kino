import { expect, test } from '@playwright/test';
import {
  createCalendar,
  createCalendarExpense,
  createEvent,
  createEventExpense,
  deleteCalendar,
  getCalendarId,
  getToken,
  login,
  makeCalendarPublic,
  resetTestData,
} from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@11. expenses summary', () => {
  test('@11.1 should not show the expense pill when a calendar has no expenses', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `No Expenses Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];
    await createEvent(request, token, calendarId, 'Free Event', today);

    await page.goto(`/calendars/${calendarUuid}`);
    await expect(page.getByTestId('trip-cost-pill')).not.toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.2 should show the pill with totals when event costs exist', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Event Cost Pill Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Hotel', today);
    await createEventExpense(request, token, eventId, 'Room', 120, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await expect(page.getByTestId('trip-cost-pill')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('trip-cost-pill')).toContainText('£120.00');

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.3 should show the pill with totals when general calendar expenses exist', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Calendar Expense Pill Test ${Date.now()}`);
    await createCalendarExpense(request, token, calendarUuid, 'Travel insurance', 62, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await expect(page.getByTestId('trip-cost-pill')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('trip-cost-pill')).toContainText('£62.00');

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.4 should open the drawer and show per-currency totals combining event and general expenses', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Drawer Totals Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Flight', today);
    await createEventExpense(request, token, eventId, 'Return ticket', 240, 'GBP');
    await createCalendarExpense(request, token, calendarUuid, 'Travel insurance', 62, 'GBP');
    await createCalendarExpense(request, token, calendarUuid, 'Visa', 45, 'EUR');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByTestId('trip-cost-pill').click();

    const drawer = page.getByTestId('trip-cost-drawer');
    await expect(drawer).toBeVisible();
    await expect(page.getByTestId('trip-total-GBP')).toContainText('£302.00');
    await expect(page.getByTestId('trip-total-EUR')).toContainText('€45.00');

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.5 should show the general expenses section at the top of the drawer', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `General Section Test ${Date.now()}`);
    await createCalendarExpense(request, token, calendarUuid, 'Travel insurance', 62, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByTestId('trip-cost-pill').click();

    await expect(page.getByText('General expenses')).toBeVisible();
    await expect(page.getByText('Travel insurance')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.6 can add a general expense from the drawer', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Add Expense Test ${Date.now()}`);
    await createCalendarExpense(request, token, calendarUuid, 'Seed expense', 10, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByTestId('trip-cost-pill').click();
    await page.getByTestId('toggle-add-expense').click();

    await page.getByTestId('expense-label-input').fill('Museum pass');
    await page.getByTestId('expense-amount-input').fill('25');
    await page.getByTestId('add-expense-button').click();

    await expect(page.getByText('Museum pass')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.7 can delete a general expense from the drawer', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Delete Expense Test ${Date.now()}`);
    await createCalendarExpense(request, token, calendarUuid, 'Insurance', 62, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByTestId('trip-cost-pill').click();

    await expect(page.getByText('Insurance')).toBeVisible();
    await page.getByRole('button', { name: 'Delete expense' }).click();
    await expect(page.getByText('Insurance')).not.toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.8 should show read-only message for general expenses on public calendars', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Public Readonly Test ${Date.now()}`);
    await makeCalendarPublic(request, token, calendarUuid);
    await createCalendarExpense(request, token, calendarUuid, 'Travel insurance', 62, 'GBP');

    await page.context().clearCookies();
    await page.goto(`/calendars/${calendarUuid}`);

    await page.getByTestId('trip-cost-pill').click();
    await expect(page.getByText('Travel expenses are only visible to owners and editors of this calendar.')).toBeVisible();
    await expect(page.getByTestId('toggle-add-expense')).not.toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.9 should close the drawer when clicking close button', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Close Drawer Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Tour', today);
    await createEventExpense(request, token, eventId, 'Ticket', 25, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByTestId('trip-cost-pill').click();
    await expect(page.getByTestId('trip-cost-drawer')).toBeVisible();

    await page.getByRole('button', { name: 'Close expenses' }).click();
    await expect(page.getByTestId('trip-cost-drawer')).not.toBeInViewport();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@11.10 should aggregate costs across multiple events and general expenses', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Multi Aggregation Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    const today = new Date().toISOString().split('T')[0];

    const ev1 = await createEvent(request, token, calendarId, 'Flight', today);
    await createEventExpense(request, token, ev1, 'Ticket', 200, 'GBP');
    const ev2 = await createEvent(request, token, calendarId, 'Hotel', today);
    await createEventExpense(request, token, ev2, 'Room', 300, 'EUR');
    await createCalendarExpense(request, token, calendarUuid, 'Travel insurance', 62, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);

    const pill = page.getByTestId('trip-cost-pill');
    await expect(pill).toContainText('£262.00');
    await expect(pill).toContainText('€300.00');

    await pill.click();
    await expect(page.getByTestId('trip-total-GBP')).toContainText('£262.00');
    await expect(page.getByTestId('trip-total-EUR')).toContainText('€300.00');

    await deleteCalendar(request, token, calendarUuid);
  });
});
