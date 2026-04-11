import { Button }               from '@/components/ui/button';
import type { Calendar }        from '@/lib/types';
import {
  CalendarIcon,
  PlusIcon
}                               from 'lucide-react';
import Link                     from 'next/link';
import { CalendarDeleteButton } from './calendar-delete-button';

interface CalendarListProps {
  calendars: Calendar[];
  from?: string;
}

export function CalendarList({ calendars, from }: CalendarListProps) {
  if (calendars.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center gap-3'>
        <div>
          <p className='text-lg font-medium'>No calendars yet</p>
          <p className='text-sm text-muted-foreground'>
            Create your first calendar to get started.
          </p>
        </div>
        {(
          <Button asChild size='sm'>
            <Link href='/calendars/create'>
              <PlusIcon className='h-4 w-4' />
              Create a calendar
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className='rounded-lg border divide-y'>
      {calendars.map((calendar) => (
        <div key={calendar.id} className='flex items-center gap-3 px-4 py-3'>
          <Link
            href={`/calendars/${calendar.id}${from ? `?from=${from}` : ''}`}
            className='flex items-center gap-3 flex-1 min-w-0'
          >
            <CalendarIcon className='h-4 w-4 shrink-0 text-muted-foreground' />
            <span className='text-sm font-medium truncate'>{calendar.name}</span>
          </Link>
          <CalendarDeleteButton
            calendarId={calendar.id}
            calendarName={calendar.name}
            isPublic={calendar.is_public}
            role={calendar.role}
          />
        </div>
      ))}
    </div>
  );
}
