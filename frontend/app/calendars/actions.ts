'use server';

import { cookies }        from 'next/headers';
import { revalidatePath } from 'next/cache';

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
}
