import Calendar                    from '@/components/calendar-no-ssr';
import { CalendarFavouriteButton } from '@/components/calendars/calendar-favourite-button';
import { CalendarShareButton }     from '@/components/calendars/calendar-share-button';
import { PrivateCalendarOverlay }  from '@/components/calendars/private-calendar-overlay';
import { ReadOnlyBanner }          from '@/components/calendars/read-only-banner';
import { Button }                  from '@/components/ui/button';
import { Separator }               from '@/components/ui/separator';
import { EventsProvider }          from '@/context/events-context';
import type {
  Calendar as CalendarType,
  CalendarExpense,
  Event
}                                  from '@/lib/types';
import { CalendarEvent }           from '@/utils/data';
import {
  ArrowLeft,
  Pencil
}                                  from 'lucide-react';
import { cookies }                 from 'next/headers';
import Link                        from 'next/link';
import { redirect }                from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const dbEventToCalendarEvent = (event: Event): CalendarEvent => {
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
    links: event.links,
    expenses: event.expenses,
  };
}

const getToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value ?? null;
}

const getCalendar = async (
  calendarUuid: string,
  token: string | null
): Promise<{ calendar: CalendarType & { is_favourite: boolean }; status: number }> => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/calendars/${calendarUuid}`, {
    cache: 'no-store',
    headers,
  });

  if (res.status === 401) redirect('/login');

  return { calendar: res.ok ? await res.json() : ({} as CalendarType & { is_favourite: boolean }), status: res.status };
}

const getCalendarEvents = async (calendarUuid: string, token: string | null): Promise<Event[]> => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE_URL}/api/events/?calendar_uuid=${calendarUuid}`,
    { cache: 'no-store', headers }
  );

  if (!res.ok) return [];
  return res.json();
}

const getCalendarExpenses = async (calendarUuid: string, token: string | null): Promise<CalendarExpense[]> => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE_URL}/api/calendars/${calendarUuid}/expenses`,
    { cache: 'no-store', headers }
  );

  if (!res.ok) return [];
  return res.json();
}

const CalendarPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ from?: string }>;
}) => {
  const { uuid } = await params;
  const { from } = await searchParams;
  const backHref = from === 'home' ? '/home' : '/calendars';

  const token = await getToken();
  const isAuthenticated = !!token;
  const cookieStore = await cookies();
  const preferredCurrency = cookieStore.get('currency')?.value ?? 'GBP';

  const { calendar, status } = await getCalendar(uuid, token);

  // Private calendar — unauthenticated user
  if (status === 403) {
    return (
      <div className='relative py-4'>
        <div className='flex flex-col w-full items-center'>
          <div className='w-full px-5 space-y-5'>
            <Link
              href='/login'
              className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1'
            >
              <ArrowLeft className='h-4 w-4' />
              Sign in
            </Link>
            <div className='flex items-center gap-1'>
              <h2 className='text-2xl font-semibold tracking-tight md:text-3xl select-none cursor-default'>
                Calendar
              </h2>
            </div>
            <Separator />
            <div className='relative min-h-[50vh]'>
              <PrivateCalendarOverlay />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status !== 200) {
    redirect(isAuthenticated ? '/calendars' : '/login');
  }

  const [dbEvents, calendarExpenses] = await Promise.all([
    getCalendarEvents(uuid, token),
    getCalendarExpenses(uuid, token),
  ]);
  const events = dbEvents.map(dbEventToCalendarEvent);

  const readOnly = !isAuthenticated;
  const canShare = calendar.role === 'owner' || calendar.role === 'editor';

  return (
    <EventsProvider
      calendarId={calendar.id}
      calendarUuid={String(calendar.uuid)}
      serverEvents={events}
      serverCalendarExpenses={calendarExpenses}
      readOnly={readOnly}
      preferredCurrency={preferredCurrency}
    >
      <ReadOnlyBanner />
      <div className='relative py-4'>
          <div className='flex flex-col w-full items-center'>
            <div className='w-full px-5 space-y-5'>

              <div className='space-y-0'>

                <Link
                  href={backHref}
                  aria-label='Go back'
                  className='inline-flex items-center text-muted-foreground hover:text-foreground mb-1'
                >
                  <ArrowLeft className='h-4 w-4' />
                </Link>
                <div className='flex items-center gap-1'>
                  <h2 className='text-2xl font-semibold tracking-tight md:text-3xl select-none cursor-default'>
                    {calendar.name}
                  </h2>

                  <CalendarFavouriteButton
                    calendarUuid={String(calendar.uuid)}
                    isFavourite={calendar.is_favourite}
                    disabled={readOnly}
                  />
                  {canShare && (
                    <CalendarShareButton
                      calendarUuid={String(calendar.uuid)}
                      calendarName={calendar.name}
                      isPublic={calendar.is_public}
                    />
                  )}
                  {calendar.role === 'owner' && (
                    <Button variant='ghost' size='icon' asChild>
                      <Link href={`/calendars/${calendar.uuid}/edit`} aria-label='Edit calendar'>
                        <Pencil className='h-5 w-5 text-muted-foreground' />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              <Separator />
              <Calendar />
            </div>
          </div>
        </div>
    </EventsProvider>
  );
};

export default CalendarPage;
