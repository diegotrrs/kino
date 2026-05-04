import { APIRequestContext, Page } from '@playwright/test';

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

export const login = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_TEST_EMAIL!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL('/home');
};

export const getToken = async (request: APIRequestContext): Promise<string> => {
  const res = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: process.env.E2E_TEST_EMAIL!,
      password: process.env.E2E_TEST_PASSWORD!,
    },
  });
  const { access_token } = await res.json() as { access_token: string };
  return access_token;
};

export const createCalendar = async (
  request: APIRequestContext,
  token: string,
  name: string,
): Promise<string> => {
  const res = await request.post(`${API_URL}/api/calendars/`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name },
  });
  const { uuid } = await res.json() as { uuid: string };
  return uuid;
};

export const deleteCalendar = async (
  request: APIRequestContext,
  token: string,
  uuid: string,
): Promise<void> => {
  await request.delete(`${API_URL}/api/calendars/${uuid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const makeCalendarPublic = async (
  request: APIRequestContext,
  token: string,
  uuid: string,
): Promise<void> => {
  await request.patch(`${API_URL}/api/calendars/${uuid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { is_public: true },
  });
};

export const resetTestData = async (request: APIRequestContext): Promise<void> => {
  await request.delete(`${API_URL}/api/test/reset`, {
    headers: { 'X-Test-Secret': process.env.E2E_TEST_RESET_SECRET! },
  });
};

export const deleteUserById = async (
  request: APIRequestContext,
  userId: number,
): Promise<void> => {
  await request.delete(`${API_URL}/api/test/users/${userId}`, {
    headers: { 'X-Test-Secret': process.env.E2E_TEST_RESET_SECRET! },
  });
};

export const createTestUser = async (
  request: APIRequestContext,
  email: string,
  password: string,
  name: string,
): Promise<number> => {
  const res = await request.post(`${API_URL}/api/auth/signup`, {
    data: { name, email, password },
  });
  const { access_token } = await res.json() as { access_token: string };
  const payload = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64').toString());
  return Number(payload.sub);
};

export const inviteMember = async (
  request: APIRequestContext,
  token: string,
  calendarUuid: string,
  email: string,
): Promise<void> => {
  await request.post(`${API_URL}/api/calendars/${calendarUuid}/invite`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { email },
  });
};
