import { expect, test } from '@playwright/test';
import {
  createCalendar,
  createEvent,
  deleteCalendar,
  getCalendarId,
  getToken,
  login,
  resetTestData,
} from './helpers/api';

// Same date convention as the other specs (calendars start "today" on the server)
const daysFromToday = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@15. day names', () => {
  test('@15.1 should name a day from "+ Name this day", keep it after a reload, and remove it', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Day Names Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    // An event two days out makes the trip span three days, so unnamed trip days show the marker
    await createEvent(request, token, calendarId, 'Museum', daysFromToday(2));

    await page.goto(`/calendars/${calendarUuid}`);
    await page.getByRole('button', { name: '+ Name this day' }).first().click();
    const input = page.getByPlaceholder('Add a title for this day…');
    await input.fill('Visit to Vatican');
    await input.press('Enter');

    await expect(page.getByRole('button', { name: 'Visit to Vatican' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Visit to Vatican' })).toBeVisible();

    await page.getByRole('button', { name: 'Visit to Vatican' }).click();
    await page.getByRole('button', { name: 'Remove name' }).click();
    await expect(page.getByRole('button', { name: 'Visit to Vatican' })).toHaveCount(0);

    await page.reload();
    await expect(page.getByText('Visit to Vatican')).toHaveCount(0);

    await deleteCalendar(request, token, calendarUuid);
  });

  test('@15.2 should not show "+ Name this day" outside the trip', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Day Names Range Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    await createEvent(request, token, calendarId, 'Museum', daysFromToday(1));

    await page.goto(`/calendars/${calendarUuid}`);

    // Trip = today and tomorrow, so at most two markers; every other day of the month stays clean
    await expect(page.getByRole('button', { name: '+ Name this day' }).first()).toBeVisible();
    expect(await page.getByRole('button', { name: '+ Name this day' }).count()).toBeLessThanOrEqual(2);

    await deleteCalendar(request, token, calendarUuid);
  });
});

test.describe('@15. day names on phones', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('@15.3 should name a day from the day sheet', async ({
    page,
    request,
  }) => {
    const token = await getToken(request);
    const calendarUuid = await createCalendar(request, token, `Day Names Phone Test ${Date.now()}`);
    const calendarId = await getCalendarId(request, token, calendarUuid);
    await createEvent(request, token, calendarId, 'Museum', daysFromToday(1));

    await page.goto(`/calendars/${calendarUuid}`);
    // On phones, tapping a day (here via its event) opens the day sheet
    await page.locator('.fc-event').first().tap();
    const input = page.getByPlaceholder('Add a title for this day…');
    await input.fill('Visit to Vatican');
    await page.keyboard.press('Escape');

    await expect(page.locator('.fc').getByText('Visit to Vatican')).toBeVisible();

    // Saved when the sheet closed: still there after reloading
    await expect(async () => {
      await page.reload();
      await expect(page.locator('.fc').getByText('Visit to Vatican')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    await deleteCalendar(request, token, calendarUuid);
  });
});
