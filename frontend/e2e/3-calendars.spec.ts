import {
  expect,
  test
} from '@playwright/test';
import {
  createCalendar,
  deleteCalendar,
  getToken,
  login,
  makeCalendarPublic,
  resetTestData
} from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@3. calendars', () => {
  test('@3.1 should display calendars on the home page', async ({ page }) => {
    await page.goto('/home');
    await expect(
      page.getByRole('heading', { name: 'My Calendars' })
    ).toBeVisible();
  });

  test('@3.2 should create a new calendar and show it in the list', async ({
    page,
  }) => {
    const name = `New Calendar ${Date.now()}`;
    await page.goto('/calendars/create');
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: /^create$/i }).click();
    await page.waitForURL('/home');
    await expect(page.getByRole('link', { name })).toBeVisible();
  });

  test('@3.3 should open a calendar and show the calendar view', async ({
    page,
    request,
  }) => {
    const name = `Open Calendar ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await page.goto('/home');
    await page.getByText(name).click();
    await expect(page).toHaveURL(new RegExp(`/calendars/${uuid}`));
    await expect(page.getByRole('heading', { name })).toBeVisible();
  });

  test('@3.4 should edit a calendar name and show the updated name', async ({
    page,
    request,
  }) => {
    const name = `Edit Calendar ${Date.now()}`;
    const updatedName = `${name} Updated`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await page.goto(`/calendars/${uuid}/edit`);
    const nameInput = page.getByLabel('Name');
    await nameInput.clear();
    await nameInput.fill(updatedName);
    await page.getByRole('button', { name: /^save$/i }).click();
    await page.waitForURL(`/calendars/${uuid}`);
    await expect(
      page.getByRole('heading', { name: updatedName })
    ).toBeVisible();
  });

  test('@3.5 should delete a calendar and remove it from the list', async ({
    page,
    request,
  }) => {
    const name = `Delete Calendar ${Date.now()}`;
    const token = await getToken(request);
    await createCalendar(request, token, name);
    await page.goto('/home');
    await expect(page.getByText(name)).toBeVisible();
    const row = page.getByRole('link', { name }).locator('..');
    await row.getByRole('button', { name: /options/i }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await page.getByRole('button', { name: /^delete$/i }).click();
    await page.waitForURL('/home');
    await expect(page.getByRole('link', { name })).not.toBeVisible();
  });

  test('@3.6 should mark a calendar as a favourite', async ({
    page,
    request,
  }) => {
    const name = `Favourite Calendar ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await page.goto(`/calendars/${uuid}`);
    await page.getByRole('button', { name: /add to favourites/i }).click();
    await expect(
      page.getByRole('button', { name: /remove from favourites/i })
    ).toBeVisible();
  });

  test('@3.7 should show a deleted calendar in Settings > Recover deleted calendars', async ({
    page,
    request,
  }) => {
    const name = `Deleted Calendar ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await deleteCalendar(request, token, uuid);
    await page.goto('/settings/deleted-calendars');
    await expect(page.getByText(name)).toBeVisible();
  });

  test('@3.8 should restore a deleted calendar and show it back in the list', async ({
    page,
    request,
  }) => {
    const name = `Restore Calendar ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await deleteCalendar(request, token, uuid);
    await page.goto('/settings/deleted-calendars');
    await expect(page.getByText(name)).toBeVisible();
    await page
      .getByRole('listitem')
      .filter({ hasText: name })
      .getByRole('button', { name: /^restore$/i })
      .click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(name)).not.toBeVisible();
    await page.goto('/home');
    await expect(page.getByText(name)).toBeVisible();
  });

  test('@3.9 should show a public calendar in read-only mode without authentication', async ({
    page,
    request,
  }) => {
    const name = `Public Calendar ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await makeCalendarPublic(request, token, uuid);
    await page.context().clearCookies();
    await page.goto(`/calendars/${uuid}`);
    await expect(page.getByText(/viewing in read-only mode/i)).toBeVisible();
  });

  test('@3.10 should not show the Add Event button in read-only mode', async ({
    page,
    request,
  }) => {
    const name = `Public Calendar ${Date.now()}`;
    const token = await getToken(request);
    const uuid = await createCalendar(request, token, name);
    await makeCalendarPublic(request, token, uuid);
    await page.context().clearCookies();
    await page.goto(`/calendars/${uuid}`);
    await expect(
      page.getByRole('button', { name: /add event/i })
    ).not.toBeVisible();
  });
});
