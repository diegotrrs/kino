import {
  expect,
  test
}                from '@playwright/test';
import { login } from './helpers/api';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@6. settings', () => {
  test('@6.1 should show the Appearance section on the Settings page', async ({
    page,
  }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Appearance' })
    ).toBeVisible();
  });

  test('@6.2 should switch to dark mode', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('@6.3 should navigate to Recover deleted calendars from Settings', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page
      .getByRole('link', { name: /recover deleted calendars/i })
      .click();
    await expect(page).toHaveURL('/settings/deleted-calendars');
  });
});
