'use server';

import { cookies }        from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect }       from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

export async function deleteCalendar(id: number) {
  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;

  const res = await fetch(`${API_BASE_URL}/api/calendars/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to delete calendar: ${text}`);
  }

  revalidatePath('/calendars');
  revalidatePath('/home');
}

export async function createCalendar(name: string) {
  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/api/calendars/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create calendar: ${text}`);
  }

  revalidatePath('/calendars');
  revalidatePath('/home');
}

export async function updateCalendar(id: number, name: string) {
  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/api/calendars/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update calendar: ${text}`);
  }

  revalidatePath('/calendars');
  revalidatePath(`/calendars/${id}`);
  revalidatePath('/home');
}

export async function toggleFavourite(calendarId: number, isFavourite: boolean) {
  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/api/calendars/${calendarId}/favourite`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_favourite: isFavourite }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update favourite: ${text}`);
  }

  revalidatePath('/home');
  revalidatePath(`/calendars/${calendarId}`);
}
