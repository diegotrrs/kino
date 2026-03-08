import { CalendarList } from '@/components/calendars/calendar-list';
import { Separator }    from '@/components/ui/separator';
import type { Calendar } from '@/lib/types';
import { cookies }      from 'next/headers';
import { redirect }     from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

async function getCalendars(): Promise<Calendar[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/login');

  const res = await fetch(`${API_BASE_URL}/api/calendars/`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) redirect('/login');

  if (!res.ok) {
    throw new Error(`Failed to fetch calendars (${res.status})`);
  }

  return res.json();
}

export default async function CalendarsPage() {
  const calendars = await getCalendars();

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='space-y-0'>
            <h2 className='text-2xl font-semibold tracking-tight md:text-3xl'>
              My Calendars
            </h2>
            <p className='text-xs md:text-sm font-medium text-muted-foreground'>
              Manage your calendars.
            </p>
          </div>

          <Separator />

          <CalendarList calendars={calendars} />
        </div>
      </div>
    </div>
  );
}
