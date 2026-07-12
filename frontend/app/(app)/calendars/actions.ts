'use server';
import type { CalendarExpense, CreateEventInput } from '@/lib/types';
import { getTripBySlug }        from '@/app/(marketing)/trips/trips-data';
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

const STOP_COLORS = [
  '#16a34a', '#2563eb', '#7c3aed', '#ea580c', '#0891b2', '#dc2626', '#ca8a04',
];

const addDays = (date: string, n: number): string => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const buildTripEvents = (
  stops: Array<{ pinId: number; place: string; days: number; travelFromPrev?: string }>,
  calendarId: number,
  startDate: string,
): CreateEventInput[] => {
  const events: CreateEventInput[] = [];
  let offset = 0;
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const date    = addDays(startDate, offset);
    const endDate = stop.days > 1 ? addDays(startDate, offset + stop.days - 1) : null;
    events.push({
      calendar_id: calendarId,
      title:       stop.place,
      date,
      end_date:    endDate ?? undefined,
      start_time:  stop.travelFromPrev ? '14:00' : '09:00',
      end_time:    '20:00',
      color:       STOP_COLORS[i % STOP_COLORS.length],
      description: stop.travelFromPrev
        ? `Travel from ${stops[i - 1].place}: ${stop.travelFromPrev}`
        : null,
    });
    offset += stop.days;
  }
  return events;
};

export const createCalendar = async (name: string, startDate?: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const body: Record<string, string> = { name };
  if (startDate) body['start_date'] = startDate;

  const res = await fetch(`${API_BASE_URL}/api/calendars/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create calendar: ${text}`);
  }

  revalidatePath('/home');
};

export const createTripCalendar = async (
  tripSlug: string,
  name: string,
  startDate: string,
): Promise<{ uuid: string }> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const body = { name, start_date: startDate };
  const calRes = await fetch(`${API_BASE_URL}/api/calendars/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!calRes.ok) {
    const text = await calRes.text();
    throw new Error(`Failed to create calendar: ${text}`);
  }
  const calendar: { id: number; uuid: string } = await calRes.json();

  const trip = getTripBySlug(tripSlug);
  if (trip?.map?.stops?.length) {
    const events = buildTripEvents(trip.map.stops, calendar.id, startDate);
    await Promise.all(
      events.map((ev) =>
        fetch(`${API_BASE_URL}/api/events/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(ev),
        }),
      ),
    );
  }

  revalidatePath('/home');
  return { uuid: calendar.uuid };
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
