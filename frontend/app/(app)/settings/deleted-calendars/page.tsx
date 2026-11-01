import { RestoreCalendarButton } from '@/components/calendars/restore-calendar-button';
import { Separator }             from '@/components/ui/separator';
import { ArrowLeft }             from 'lucide-react';
import {
  getLocale,
  getTranslations
}                                from 'next-intl/server';
import { cookies }               from 'next/headers';
import Link                      from 'next/link';
import { redirect }              from 'next/navigation';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

type DeletedCalendar = {
  id: number;
  uuid: string;
  name: string;
  deleted_at: string;
};

const getDeletedCalendars = async (token: string): Promise<DeletedCalendar[]> => {
  const res = await fetch(`${API_BASE_URL}/api/calendars/deleted`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to fetch deleted calendars (${res.status})`);

  return res.json();
}

const DeletedCalendarsPage = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  const [deletedCalendars, t, locale] = await Promise.all([
    getDeletedCalendars(token),
    getTranslations('deletedCalendars'),
    getLocale(),
  ]);

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='space-y-0'>
            <Link
              href='/settings'
              className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1'
            >
              <ArrowLeft className='h-4 w-4' />
              {t('backTo')}
            </Link>
            <h2 className='text-3xl font-extrabold tracking-tighter md:text-4xl'>
              {t('title')}
            </h2>
            <p className='text-xs md:text-sm font-medium text-muted-foreground'>
              {t('subtitle')}
            </p>
          </div>

          <Separator />

          {deletedCalendars.length === 0 ? (
            <p className='text-sm text-muted-foreground'>{t('empty')}</p>
          ) : (
            <ul className='space-y-2'>
              {deletedCalendars.map((calendar) => (
                <li
                  key={calendar.id}
                  className='flex items-center justify-between rounded-md border px-4 py-3'
                >
                  <div>
                    <p className='text-sm font-medium'>{calendar.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {t('deletedOn', {
                        date: new Date(calendar.deleted_at).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }),
                      })}
                    </p>
                  </div>
                  <RestoreCalendarButton calendarUuid={String(calendar.uuid)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeletedCalendarsPage;
