'use server';
import type { CreateEventInput, EventLink } from '@/lib/types';
import { revalidatePath }                   from 'next/cache';
import { cookies }                          from 'next/headers';

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

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Failed to delete link: ${text}`);
  }

  revalidatePath('/calendars');
}
