import { Button }               from '@/components/ui/button';
import type { Calendar }        from '@/lib/types';
import {
  CalendarIcon,
  PlusIcon,
  Star
}                               from 'lucide-react';
import {
  useLocale,
  useTranslations
}                               from 'next-intl';
import Link                     from 'next/link';
import { CalendarDeleteButton } from './calendar-delete-button';

type CalendarListProps = {
  calendars: Calendar[];
  from?: string;
}

const formatStartDate = (isoDate: string, locale: string): string =>
  new Date(`${isoDate.slice(0, 10)}T12:00:00`)
    .toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();

export const CalendarList = ({ calendars, from }: CalendarListProps) => {
  const t = useTranslations('calendarList');
  const locale = useLocale();

  if (calendars.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-lg border border-dashed bg-card/60 p-12 text-center gap-4'>
        <div className='space-y-1'>
          <p className='font-display text-xl font-bold tracking-tight'>{t('emptyTitle')}</p>
          <p className='text-sm text-muted-foreground'>
            {t('emptyHint')}
          </p>
        </div>
        {(
          <Button asChild size='sm'>
            <Link href='/calendars/create'>
              <PlusIcon className='h-4 w-4' />
              {t('create')}
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className='rounded-lg border bg-card divide-y divide-dashed'>
      {calendars.map((calendar) => (
        <div key={calendar.id} className='flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/50'>
          <Link
            href={`/calendars/${calendar.uuid}${from ? `?from=${from}` : ''}`}
            className='flex items-center gap-3 flex-1 min-w-0'
          >
            <CalendarIcon className='h-4 w-4 shrink-0 text-teal' />
            <span className='font-display text-base font-bold tracking-tight truncate'>{calendar.name}</span>
            {calendar.is_favourite && (
              <Star className='h-3.5 w-3.5 shrink-0 fill-ev-ochre text-ev-ochre' />
            )}
            {calendar.start_date && (
              <span className='ml-auto hidden shrink-0 font-mono text-xs text-muted-foreground tabular-nums sm:inline'>
                {formatStartDate(calendar.start_date, locale)}
              </span>
            )}
          </Link>
          <CalendarDeleteButton
            calendarUuid={String(calendar.uuid)}
            calendarName={calendar.name}
            isPublic={calendar.is_public}
            role={calendar.role}
          />
        </div>
      ))}
    </div>
  );
}
