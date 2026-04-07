import Calendar from '@/components/calendar-no-ssr';
import { CalendarFavouriteButton } from '@/components/calendars/calendar-favourite-button';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EventsProvider } from '@/context/events-context';
import type { Calendar as CalendarType, Event } from '@/lib/types';
import { CalendarEvent } from '@/utils/data';
import { ArrowLeft, Pencil } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

function dbEventToCalendarEvent(event: Event): CalendarEvent {
  const start = new Date(`${event.date}T${event.start_time}`);
  const endDate = event.end_date ?? event.date;
  const end = event.end_time
    ? new Date(`${endDate}T${event.end_time}`)
    : new Date(start.getTime() + 60 * 60 * 1000);

  return {
    id: String(event.id),
    title: event.title,
    description: event.description ?? '',
    start,
    end,
    backgroundColor: event.color,
  };
}

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  return token;
}

async function getCalendar(calendarId: number, token: string): Promise<CalendarType & { is_favourite: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/calendars/${calendarId}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to fetch calendar (${res.status})`);

  return res.json();
}

async function getCalendarEvents(calendarId: number, token: string): Promise<Event[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/events/?calendar_id=${calendarId}`,
    {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);

  return res.json();
}

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref  = from === 'home' ? '/home' : '/calendars';
  const backLabel = from === 'home' ? 'Home' : 'My Calendars';
  const calendarId = Number(id);
  const token = await getToken();
  const [calendar, dbEvents] = await Promise.all([
    getCalendar(calendarId, token),
    getCalendarEvents(calendarId, token),
  ]);
  const events = dbEvents.map(dbEventToCalendarEvent);

  return (
    <EventsProvider calendarId={calendarId} serverEvents={events}>
      <div className='relative py-4'>
        <div className='flex flex-col w-full items-center'>
          <div className='w-full px-5 space-y-5'>

            <div className='space-y-0'>

              <Link
                href={backHref}
                className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1'
              >
                <ArrowLeft className='h-4 w-4' />
                {backLabel}
              </Link>
              <div className='flex items-center gap-1'>
                <h2 className='text-2xl font-semibold tracking-tight md:text-3xl select-none cursor-default'>
                  {calendar.name}
                </h2>

                <CalendarFavouriteButton
                  calendarId={calendarId}
                  isFavourite={calendar.is_favourite}
                />
                <Button variant='ghost' size='icon' asChild>
                  <Link href={`/calendars/${calendarId}/edit`} aria-label='Edit calendar'>
                    <Pencil className='h-5 w-5 text-muted-foreground' />
                  </Link>
                </Button>
              </div>
            </div>
            <Separator />
            <Calendar />
          </div>
        </div>
      </div>
    </EventsProvider>
  );
}
