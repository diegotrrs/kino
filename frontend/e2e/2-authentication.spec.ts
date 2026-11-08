import {
  expect,
  test
} from '@playwright/test';
import {
  deleteUserById,
  login
} from './helpers/api';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL!;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD!;

test.describe('@2. authentication', () => {
  test('@2.1 should log in with valid credentials and redirect to /home', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^login$/i }).click();
    await page.waitForURL('/home');
  });

  test('@2.2 should show an error when logging in with an incorrect password', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill('wrongpassword');
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 15000 });
  });

  test('@2.2b should keep the typed email after a wrong password so only the password needs re-entering', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill('wrongpassword');
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 15000 });

    await expect(page.getByLabel('Email')).toHaveValue(TEST_EMAIL);
    await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  });

  test('@2.3 should show an error when logging in with a non-existent email', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('notregistered@example.com');
    await page.getByLabel('Password', { exact: true }).fill('somepassword123');
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 15000 });
  });

  test('@2.4 should sign up with a new account and redirect to /home', async ({
    page,
    request,
  }) => {
    const uniqueEmail = `e2e+${Date.now()}@kino.com`;
    await page.goto('/signup');
    await page.getByLabel('Name').fill('E2E Test User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page
      .getByLabel('Password', { exact: true })
      .fill('securepassword123');
    await page.getByLabel('Confirm password').fill('securepassword123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL('/home');

    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === 'token')?.value;
    if (token) {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      await deleteUserById(request, Number(payload.sub));
    }
  });

  test('@2.5 should not submit the sign-up form when required fields are empty', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL('/signup');
  });

  test('@2.6 should show an error when signing up with an already registered email', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page
      .getByLabel('Password', { exact: true })
      .fill('securepassword123');
    await page.getByLabel('Confirm password').fill('securepassword123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(
      page.getByText('A user with this email already exists')
    ).toBeVisible();
  });

  test('@2.7 should redirect an unauthenticated user to /login when accessing /home', async ({
    page,
  }) => {
    await page.goto('/home');
    await expect(page).toHaveURL('/login');
  });

  test('@2.8 should log out and redirect to the login page', async ({
    page,
  }) => {
    await login(page);
    await page.getByRole('button', { name: /menu/i }).click();
    await page.getByRole('menuitem', { name: /log out/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('@2.9 should request a password reset and show a confirmation message', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(
      page.getByText('If that email is registered, a reset link has been sent.')
    ).toBeVisible();
  });

  test('@2.10 should carry the email typed on the login page over to forgot password', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByRole('link', { name: /forgot/i }).click();

    await page.waitForURL('/forgot-password');
    await expect(page.getByLabel('Email')).toHaveValue(TEST_EMAIL);
  });
});
