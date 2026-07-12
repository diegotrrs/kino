'use server';
import type { CalendarExpense } from '@/lib/types';
import { revalidatePath }       from 'next/cache';
import { cookies }              from 'next/headers';
import { redirect }             from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

export const deleteCalendar = async (uuid: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(`${API_BASE_URL}/api/calendars/${uuid}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to delete calendar: ${text}`);
  }

  revalidatePath('/calendars');
  revalidatePath('/home');
};

export const restoreCalendar = async (uuid: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/api/calendars/${uuid}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to restore calendar: ${text}`);
  }

  revalidatePath('/calendars');
  revalidatePath('/home');
  revalidatePath('/settings/deleted-calendars');
};

export const createCalendar = async (name: string, startDate?: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const body: Record<string, string> = { name };
  if (startDate) body['start_date'] = startDate;

  const res = await fetch(`${API_BASE_URL}/api/calendars/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create calendar: ${text}`);
  }

  revalidatePath('/calendars');
  revalidatePath('/home');
};

export const updateCalendarVisibility = async (
  uuid: string,
  isPublic: boolean,
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/api/calendars/${uuid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_public: isPublic }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update calendar visibility: ${text}`);
  }

  revalidatePath('/calendars');
  revalidatePath(`/calendars/${uuid}`);
  revalidatePath('/home');
};

export const updateCalendar = async (uuid: string, name: string, startDate?: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const body: Record<string, string> = { name };
  if (startDate) body['start_date'] = startDate;

  const res = await fetch(`${API_BASE_URL}/api/calendars/${uuid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update calendar: ${text}`);
  }

  revalidatePath('/calendars');
  revalidatePath(`/calendars/${uuid}`);
  revalidatePath('/home');
};

export const inviteToCalendar = async (calendarUuid: string, email: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(
    `${API_BASE_URL}/api/calendars/${calendarUuid}/invite`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to invite user: ${text}`);
  }

  revalidatePath(`/calendars/${calendarUuid}/edit`);
};

export const removeMember = async (calendarUuid: string, userId: number) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(
    `${API_BASE_URL}/api/calendars/${calendarUuid}/users/${userId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to remove member: ${text}`);
  }

  revalidatePath(`/calendars/${calendarUuid}/edit`);
};

export const toggleFavourite = async (
  calendarUuid: string,
  isFavourite: boolean,
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(
    `${API_BASE_URL}/api/calendars/${calendarUuid}/favourite`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_favourite: isFavourite }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update favourite: ${text}`);
  }

  revalidatePath('/home');
  revalidatePath(`/calendars/${calendarUuid}`);
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

export const addCalendarExpense = async (
  calendarUuid: string,
  label: string,
  amount: number,
  currency: string,
): Promise<CalendarExpense> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/calendars/${calendarUuid}/expenses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ label, amount, currency }),
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to add expense: ${text}`);
  }

  return res.json();
};

export const deleteCalendarExpense = async (
  calendarUuid: string,
  expenseId: number,
): Promise<void> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/calendars/${calendarUuid}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers,
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to delete expense: ${text}`);
  }
};
