'use server';
import type { CreateEventInput } from '@/lib/types';
import { cookies }               from 'next/headers';
import { revalidatePath }        from 'next/cache';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function createEvent(input: CreateEventInput) {
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

export async function updateEvent(id: number, input: Partial<Omit<CreateEventInput, 'calendar_id'>>) {
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

export async function deleteEvent(id: number) {
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
