import {
  expect,
  test
}                from '@playwright/test';
import {
  login,
  resetTestData
}                from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe('@7. i18n', () => {
  test('@7.1 should switch language and persist the preference', async ({
    page,
  }) => {
    await page.goto('/settings');

    // Switch to Spanish
    await page.getByTestId('language-selector').getByRole('button', { name: 'Español' }).click();

    // Verify nav label changes to Spanish
    await expect(page.getByTestId('nav-home').first()).toContainText('Inicio');

    // Reload and verify preference is persisted
    await page.reload();
    await expect(page.getByTestId('nav-home').first()).toContainText('Inicio');

    // Switch back to English so other tests are not affected
    await page.goto('/settings');
    await page.getByTestId('language-selector').getByRole('button', { name: 'English' }).click();
  });
});
