'use server';
import type { CreateEventInput, EventExpense, EventLink } from '@/lib/types';
import { revalidatePath }                   from 'next/cache';
import { cookies }                          from 'next/headers';
import { redirect }                         from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export const createEvent = async (input: CreateEventInput) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/events/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create event: ${text}`);
  }

  revalidatePath('/events');
  return res.json();
}

export const updateEvent = async (id: number, input: Partial<Omit<CreateEventInput, 'calendar_id'>>) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(input),
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update event: ${text}`);
  }

  revalidatePath('/events');
  return res.json();
}

export const deleteEvent = async (id: number) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to delete event: ${text}`);
  }

  revalidatePath('/events');
}

export const addEventLink = async (eventId: number, url: string): Promise<EventLink> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/links`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to add link: ${text}`);
  }

  revalidatePath('/calendars');
  return res.json();
}

export const deleteEventLink = async (eventId: number, linkId: number): Promise<void> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/links/${linkId}`, {
    method: 'DELETE',
    headers,
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to delete link: ${text}`);
  }

  revalidatePath('/calendars');
}

export const addEventExpense = async (
  eventId: number,
  label: string,
  amount: number,
  currency: string,
): Promise<EventExpense> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/expenses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ label, amount, currency }),
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to add expense: ${text}`);
  }

  revalidatePath('/calendars');
  return res.json();
}

export const deleteEventExpense = async (eventId: number, expenseId: number): Promise<void> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers,
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to delete expense: ${text}`);
  }

  revalidatePath('/calendars');
}
