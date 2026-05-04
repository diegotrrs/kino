import {
  expect,
  test
} from '@playwright/test';

test.describe('@1. landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@1.1 should display the hero heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /your holidays, perfectly planned/i })
    ).toBeVisible();
  });

  test('@1.2 should display a get started link pointing to /signup', async ({
    page,
  }) => {
    const link = page.getByRole('link', { name: /get started free/i }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/signup');
  });

  test('@1.3 should display a sign in link pointing to /login', async ({
    page,
  }) => {
    const link = page.getByRole('link', { name: /sign in/i }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/login');
  });

  test('@1.4 should display the features section', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: /everything you need to plan a great trip/i,
      })
    ).toBeVisible();
  });

  test('@1.5 should display the how it works section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /up and running in minutes/i })
    ).toBeVisible();
  });

  test('@1.6 should display the footer', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer')).toContainText(/kino calendars/i);
  });

  test('@1.7 should navigate to /signup when clicking get started free', async ({
    page,
  }) => {
    await page
      .getByRole('link', { name: /get started free/i })
      .first()
      .click();
    await expect(page).toHaveURL('/signup');
  });

  test('@1.8 should navigate to /login when clicking sign in', async ({
    page,
  }) => {
    await page
      .getByRole('link', { name: /sign in/i })
      .first()
      .click();
    await expect(page).toHaveURL('/login');
  });
});
