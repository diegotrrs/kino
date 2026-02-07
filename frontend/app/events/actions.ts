'use server';

import { revalidatePath } from 'next/cache';
import type { CreateEventInput } from '@/lib/types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

export async function createEvent(input: CreateEventInput) {
  const res = await fetch(`${API_BASE_URL}/api/events/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create event: ${text}`);
  }

  revalidatePath('/events');
  return res.json();
}

export async function deleteEvent(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete event: ${text}`);
  }

  revalidatePath('/events');
}
