import {
  expect,
  test
} from '@playwright/test';
import {
  createCalendar,
  createEvent,
  createEventCost,
  deleteCalendar,
  getCalendarId,
  getToken,
  login,
  resetTestData
} from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@10. cost entries', () => {
  test('@10.1 should add a cost to an existing event and display it', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Costs Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);

    const today = new Date().toISOString().split('T')[0];
    await createEvent(request, token, calendarId, 'Museum Visit', today);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByText('Museum Visit').first().click();

    await page.getByTestId('add-cost-trigger').click();
    await page.getByTestId('cost-label-input').fill('Coffee');
    await page.getByTestId('cost-amount-input').fill('2.50');
    await page.getByTestId('add-cost-button').click();

    await expect(page.getByText('£2.50 Coffee')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@10.2 should show grouped totals badge when costs are added', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Costs Totals Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);

    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Day Trip', today);
    await createEventCost(request, token, eventId, 'Coffee', 2.50, 'GBP');
    await createEventCost(request, token, eventId, 'Ticket', 4.00, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByText('Day Trip').first().click();

    await expect(page.getByText('£6.50')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@10.3 should delete a cost from an event', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Costs Delete Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);

    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Lunch', today);
    await createEventCost(request, token, eventId, 'Sandwich', 5.00, 'GBP');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByText('Lunch').first().click();

    await expect(page.getByText('£5.00 Sandwich')).toBeVisible();
    await page.getByTestId('delete-cost-button').first().click();
    await expect(page.getByText('£5.00 Sandwich')).not.toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@10.4 should add costs when creating a new event', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Costs On Create Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: /add event/i }).first().click();

    await page.getByPlaceholder('Event title').fill('Event With Cost');
    await page.getByTestId('pending-add-cost-trigger').click();
    await page.getByTestId('pending-cost-label').fill('Coffee');
    await page.getByTestId('pending-cost-amount').fill('3.00');
    await page.getByTestId('pending-add-cost-button').click();

    await page.getByRole('button', { name: /add event/i }).last().click();

    await expect(page.getByText('Event With Cost')).toBeVisible({ timeout: 10000 });
    await page.getByText('Event With Cost').first().click();

    await expect(page.getByText('£3.00 Coffee')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@10.5 should show multi-currency totals', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Multi-currency Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);

    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Euro Trip', today);
    await createEventCost(request, token, eventId, 'Hotel', 120, 'GBP');
    await createEventCost(request, token, eventId, 'Dinner', 45, 'EUR');

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByText('Euro Trip').first().click();

    await expect(page.getByText(/£120\.00.*€45\.00/).first()).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@10.6 should allow changing currency in settings', async ({
    page,
  }) => {
    await page.goto('/settings');

    const currencySection = page.getByTestId('currency-selector');
    await expect(currencySection).toBeVisible();
    await expect(currencySection.getByRole('button', { name: 'EUR' })).toBeVisible();

    await currencySection.getByRole('button', { name: 'EUR' }).click();
    await expect(currencySection.getByRole('button', { name: 'EUR' })).toHaveClass(/border-foreground/);
  });
});
