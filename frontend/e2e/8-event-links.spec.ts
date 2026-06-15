import {
  expect,
  test
} from '@playwright/test';
import {
  createCalendar,
  createEvent,
  deleteCalendar,
  getCalendarId,
  getToken,
  login,
  resetTestData
} from './helpers/api';

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@8. event links', () => {
  test('@8.1 should add a link to an event and display it', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Links Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);

    const today = new Date().toISOString().split('T')[0];
    await createEvent(request, token, calendarId, 'Link Test Event', today);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByText('Link Test Event').first().click();

    const linkInput = page.getByPlaceholder('https://...');
    await expect(linkInput).toBeVisible();
    await linkInput.fill('https://example.com');
    await page.getByTestId('add-link-button').click();

    // Wait for the link to appear (backend fetches page title which may take a moment)
    await expect(page.getByTestId('event-link').first()).toBeVisible({ timeout: 15000 });

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@8.3 should persist a link after saving and reopening the event', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Links Persist Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);

    const today = new Date().toISOString().split('T')[0];
    await createEvent(request, token, calendarId, 'Persist Link Event', today);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByText('Persist Link Event').first().click();

    await page.getByPlaceholder('https://...').fill('https://example.com');
    await page.getByTestId('add-link-button').click();
    await expect(page.getByTestId('event-link').first()).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByText('Persist Link Event').first().click();
    await expect(page.getByTestId('event-link').first()).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@8.4 should add links when creating an event', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Links On Create Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: /add event/i }).first().click();

    await page.getByLabel('Title').fill('Event With Link');
    await page.getByPlaceholder('https://...').fill('https://example.com');
    await page.getByTestId('pending-add-link-button').click();

    await page.getByRole('button', { name: /add event/i }).last().click();

    await expect(page.getByText('Event With Link')).toBeVisible({ timeout: 10000 });
    await page.getByText('Event With Link').first().click();

    await expect(page.getByTestId('event-link').first()).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@8.2 should delete a link from an event', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Links Delete Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);

    const today = new Date().toISOString().split('T')[0];
    const eventId = await createEvent(request, token, calendarId, 'Delete Link Event', today);

    await request.post(
      `${API_URL}/api/events/${eventId}/links`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { url: 'https://example.com' },
      }
    );

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByText('Delete Link Event').first().click();

    await expect(page.getByTestId('event-link').first()).toBeVisible();

    await page.getByTestId('delete-link-button').first().click();

    await expect(page.getByTestId('event-link')).not.toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });
});
