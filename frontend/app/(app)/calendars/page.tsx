import { CalendarList }  from '@/components/calendars/calendar-list';
import { Button }        from '@/components/ui/button';
import { Separator }     from '@/components/ui/separator';
import type { Calendar } from '@/lib/types';
import { PlusIcon }      from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cookies }       from 'next/headers';
import Link              from 'next/link';
import { redirect }      from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

const getCalendars = async (): Promise<Calendar[]> => {
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

const CalendarsPage = async () => {
  const [calendars, t] = await Promise.all([
    getCalendars(),
    getTranslations('calendars'),
  ]);

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center cursor-default'>
        <div className='w-full px-5 space-y-5'>
          <div className='flex items-start justify-between'>
            <div className='space-y-0 cursor-default'>
              <h2 className='text-2xl font-semibold tracking-tight md:text-3xl select-none cursor-default'>
                {t('title')}
              </h2>
              <p className='text-xs md:text-sm font-medium text-muted-foreground select-none cursor-default'>
                {t('subtitle')}
              </p>
            </div>
            {calendars.length > 0 && (
              <Button asChild size='sm'>
                <Link href='/calendars/create'>
                  <PlusIcon className='h-4 w-4' />
                  {t('newCalendar')}
                </Link>
              </Button>
            )}
          </div>

          <Separator />

          <CalendarList calendars={calendars} from='calendars' />
        </div>
      </div>
    </div>
  );
};

export default CalendarsPage;
