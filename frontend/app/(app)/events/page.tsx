import { EventCreateButton } from '@/components/events/event-create-button';
import { EventList }         from '@/components/events/event-list';
import { Separator }         from '@/components/ui/separator';
import { toDayNameMap }      from '@/lib/day-names';
import type {
  Calendar,
  DayName,
  Event
}                            from '@/lib/types';
import { getTranslations }   from 'next-intl/server';
import { cookies }           from 'next/headers';
import { redirect }          from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

async function getEvents(): Promise<Event[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/api/events/`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to fetch events');

  return res.json();
}

async function getCalendars(): Promise<Calendar[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/api/calendars/`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) return [];

  return res.json();
}

async function getDayNamesByCalendar(calendars: Calendar[]): Promise<Record<number, Record<string, string>>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return {};

  const entries = await Promise.all(
    calendars.map(async (calendar) => {
      const res = await fetch(`${API_BASE_URL}/api/calendars/${calendar.uuid}/day-names`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const dayNames: DayName[] = res.ok ? await res.json() : [];
      return [calendar.id, toDayNameMap(dayNames)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export default async function EventsPage() {
  const cookieStore = await cookies();
  const preferredCurrency = cookieStore.get('currency')?.value ?? 'GBP';

  const [events, calendars, t] = await Promise.all([
    getEvents(),
    getCalendars(),
    getTranslations('events'),
  ]);
  const calendarOptions = calendars.map(({ id, name }) => ({ id, name }));
  const dayNamesByCalendar = await getDayNamesByCalendar(calendars);

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0'>
              <h2 className='flex items-center text-3xl font-extrabold tracking-tighter md:text-4xl'>
                {t('title')}
              </h2>
              <p className='text-xs md:text-sm font-medium text-muted-foreground'>
                {t('subtitle')}
              </p>
            </div>
            <EventCreateButton calendars={calendarOptions} preferredCurrency={preferredCurrency} />
          </div>

          <Separator />
          <EventList events={events} preferredCurrency={preferredCurrency} dayNamesByCalendar={dayNamesByCalendar} />
        </div>
      </div>
    </div>
  );
}
