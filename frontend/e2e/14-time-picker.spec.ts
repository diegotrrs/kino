import {
  expect,
  test
} from '@playwright/test';
import {
  createCalendar,
  deleteCalendar,
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

test.describe('@14. time picker', () => {
  test('@14.1 typing in the start time input should not close the date/time popover', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Time Picker Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: /add event/i }).first().click();
    await page.getByRole('button', { name: 'Change date and time' }).click();

    // Popover is open — start time label is visible
    await expect(page.getByText('Start time')).toBeVisible();

    // Type into the start time hour input
    const startTimeInput = page.getByLabel('Start time').locator('input').first();
    await startTimeInput.click();
    await startTimeInput.press('1');

    // Popover must still be open after typing
    await expect(page.getByText('Start time')).toBeVisible();
    await expect(page.getByText('End time')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@14.2 typing in the end time input should not close the date/time popover', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Time Picker Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: /add event/i }).first().click();
    await page.getByRole('button', { name: 'Change date and time' }).click();

    await expect(page.getByText('End time')).toBeVisible();

    const endTimeInput = page.getByLabel('End time').locator('input').first();
    await endTimeInput.click();
    await endTimeInput.press('2');

    await expect(page.getByText('Start time')).toBeVisible();
    await expect(page.getByText('End time')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@14.3 typing in the time input on edit form should not close the date/time popover', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Time Picker Edit Test ${Date.now()}`);

    await page.goto(`/calendars/${calendarUuid}`);

    // Create an event first
    await page.getByRole('button', { name: /add event/i }).first().click();
    await page.getByPlaceholder('Event title').fill('Time Picker Edit Event');
    await page.getByRole('button', { name: /add event/i }).last().click();
    await expect(page.getByText('Time Picker Edit Event')).toBeVisible({ timeout: 10000 });

    // Open the event to edit it
    await page.getByText('Time Picker Edit Event').first().click();
    await page.getByRole('button', { name: 'Change date and time' }).click();

    await expect(page.getByText('Start time')).toBeVisible();

    const startTimeInput = page.getByLabel('Start time').locator('input').first();
    await startTimeInput.click();
    await startTimeInput.press('1');

    // Popover must still be open after typing
    await expect(page.getByText('Start time')).toBeVisible();
    await expect(page.getByText('End time')).toBeVisible();

    await deleteCalendar(request, token, calendarUuid);
  });
});
