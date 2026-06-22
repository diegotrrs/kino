import { APIRequestContext, Page } from '@playwright/test';

const API_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

export const login = async (page: Page): Promise<void> => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_TEST_EMAIL!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole('button', { name: /^login$/i }).click();
  await page.waitForURL('/home');
  // Force English locale — the login server action restores the locale from the
  // DB, which may be 'es' if the i18n test ran concurrently. Override the cookie
  // and reload so the page re-renders in English before the test begins.
  await page.context().addCookies([{
    name: 'locale',
    value: 'en',
    domain: 'localhost',
    path: '/',
  }]);
  await page.reload();
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

export const createEvent = async (
  request: APIRequestContext,
  token: string,
  calendarId: number,
  title: string,
  date: string,
): Promise<number> => {
  const res = await request.post(`${API_URL}/api/events/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      calendar_id: calendarId,
      title,
      date,
      start_time: '10:00:00',
      end_time: '11:00:00',
    },
  });
  const { id } = await res.json() as { id: number };
  return id;
};

export const createEventCost = async (
  request: APIRequestContext,
  token: string,
  eventId: number,
  label: string,
  amount: number,
  currency: string,
): Promise<number> => {
  const res = await request.post(`${API_URL}/api/events/${eventId}/costs`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { label, amount, currency },
  });
  const { id } = await res.json() as { id: number };
  return id;
};

export const getCalendarId = async (
  request: APIRequestContext,
  token: string,
  calendarUuid: string,
): Promise<number> => {
  const res = await request.get(`${API_URL}/api/calendars/${calendarUuid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { id } = await res.json() as { id: number };
  return id;
};
