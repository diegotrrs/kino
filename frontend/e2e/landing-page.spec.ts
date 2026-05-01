import { expect, test } from '@playwright/test';

test.describe('landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the hero heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /your holidays, perfectly planned/i })
    ).toBeVisible();
  });

  test('should display a get started link pointing to /signup', async ({ page }) => {
    const link = page.getByRole('link', { name: /get started free/i }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/signup');
  });

  test('should display a sign in link pointing to /login', async ({ page }) => {
    const link = page.getByRole('link', { name: /sign in/i }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/login');
  });

  test('should display the features section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /everything you need to plan a great trip/i })
    ).toBeVisible();
  });

  test('should display the how it works section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /up and running in minutes/i })
    ).toBeVisible();
  });

  test('should display the footer', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer')).toContainText(/kino calendars/i);
  });

  test('should navigate to /signup when clicking get started free', async ({ page }) => {
    await page.getByRole('link', { name: /get started free/i }).first().click();
    await expect(page).toHaveURL('/signup');
  });

  test('should navigate to /login when clicking sign in', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL('/login');
  });
});
