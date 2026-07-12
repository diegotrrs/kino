import {
  expect,
  test
} from '@playwright/test';
import {
  getToken,
  login,
  resetTestData,
} from './helpers/api';

test.afterAll(async ({ request }) => {
  await resetTestData(request);
});

test.describe('@13. hot trips', () => {
  test('@13.1 should show the Hot Trips section on the home page', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: /hot trips/i })).toBeVisible();
  });

  test('@13.2 should show destination cards in the carousel', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await expect(page.getByText('Japan')).toBeVisible();
    await expect(page.getByText('Norway')).toBeVisible();
  });

  test('@13.3 should navigate to a destination page when a card is clicked', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    await page.getByRole('link', { name: /japan/i }).first().click();
    await expect(page).toHaveURL(/\/trips\/japan/);
    await expect(page.getByRole('heading', { name: 'Japan' })).toBeVisible();
  });

  test('@13.4 should show a destination page with back link and CTA', async ({ page }) => {
    await page.goto('/trips/japan');
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /plan your trip to japan/i })).toBeVisible();
  });

  test('@13.5 should pre-fill calendar name from destination CTA', async ({ page }) => {
    await login(page);
    await page.goto('/trips/japan');
    await page.getByRole('link', { name: /plan your trip to japan/i }).click();
    await expect(page).toHaveURL(/\/calendars\/create/);
    const nameInput = page.getByLabel('Name');
    await expect(nameInput).toHaveValue(/japan/i);
  });

  test('@13.6 should show Hot Trips on the landing page without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /hot trips/i })).toBeVisible();
  });

  test('@13.7 should show a destination page without authentication', async ({ page }) => {
    await page.goto('/trips/costa-rica');
    await expect(page.getByRole('heading', { name: 'Costa Rica' })).toBeVisible();
    await expect(page.getByText('The Perfect 2-Week Adventure')).toBeVisible();
  });

  test('@13.8 should return 404 for an unknown destination slug', async ({ page }) => {
    await page.goto('/trips/nonexistent-place');
    await expect(page.getByText(/404|not found/i)).toBeVisible();
  });

  test('@13.9 should create a calendar with a start date', async ({ page, request }) => {
    await login(page);
    const token = await getToken(request);
    expect(token).toBeTruthy();

    const name = `Start Date Trip ${Date.now()}`;
    await page.goto('/calendars/create');
    await page.getByLabel('Name').fill(name);

    // The start date picker should be present
    await expect(page.getByText(/start date/i)).toBeVisible();
    await page.getByRole('button', { name: /^create$/i }).click();
    await page.waitForURL('/home');
    await expect(page.getByRole('link', { name })).toBeVisible();
  });
});
