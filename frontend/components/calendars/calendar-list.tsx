import { CalendarDeleteButton } from './calendar-delete-button';
import type { Calendar }        from '@/lib/types';
import { CalendarIcon }         from 'lucide-react';
import Link                     from 'next/link';

interface CalendarListProps {
  calendars: Calendar[];
}

export function CalendarList({ calendars }: CalendarListProps) {
  if (calendars.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center'>
        <p className='text-lg font-medium'>No calendars yet</p>
        <p className='text-sm text-muted-foreground'>
          Create your first calendar to get started.
        </p>
      </div>
    );
  }

  return (
    <div className='rounded-lg border divide-y'>
      {calendars.map((calendar) => (
        <div key={calendar.id} className='flex items-center gap-3 px-4 py-3'>
          <Link
            href={`/calendars/${calendar.id}`}
            className='flex items-center gap-3 flex-1 min-w-0'
          >
            <CalendarIcon className='h-4 w-4 shrink-0 text-muted-foreground' />
            <span className='text-sm font-medium truncate'>{calendar.name}</span>
          </Link>
          <CalendarDeleteButton calendarId={calendar.id} calendarName={calendar.name} />
        </div>
      ))}
    </div>
  );
}
