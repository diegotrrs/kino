import Calendar           from '@/components/calendar';
import { Separator }      from '@/components/ui/separator';
import { EventsProvider } from '@/context/events-context';
import type { Calendar as CalendarType, Event } from '@/lib/types';
import { CalendarEvent }  from '@/utils/data';
import { cookies }        from 'next/headers';
import { redirect }       from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

function dbEventToCalendarEvent(event: Event): CalendarEvent {
  const start = new Date(`${event.date}T${event.start_time}`);
  const end   = event.end_time
    ? new Date(`${event.date}T${event.end_time}`)
    : new Date(start.getTime() + 60 * 60 * 1000);

  return {
    id:              String(event.id),
    title:           event.title,
    description:     event.description ?? '',
    start,
    end,
    backgroundColor: '#AEC6E4',
  };
}

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token       = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  return token;
}

async function getCalendar(calendarId: number, token: string): Promise<CalendarType> {
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }     = await params;
  const calendarId = Number(id);
  const token      = await getToken();
  const [calendar, dbEvents] = await Promise.all([
    getCalendar(calendarId, token),
    getCalendarEvents(calendarId, token),
  ]);
  const events = dbEvents.map(dbEventToCalendarEvent);

  return (
    <EventsProvider calendarId={calendarId} serverEvents={events}>
      <div className='py-4'>
        <div className='flex flex-col w-full items-center'>
          <div className='w-full px-5 space-y-5'>
            <div className='space-y-0'>
              <h2 className='text-2xl font-semibold tracking-tight md:text-3xl select-none cursor-default'>
                {calendar.name}
              </h2>
            </div>
            <Separator />
            <Calendar />
          </div>
        </div>
      </div>
    </EventsProvider>
  );
}
