import { CalendarDeleteButton } from './calendar-delete-button';
import type { Calendar }        from '@/lib/types';
import { CalendarIcon }         from 'lucide-react';

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
          <CalendarIcon className='h-4 w-4 shrink-0 text-muted-foreground' />
          <span className='flex-1 text-sm font-medium'>{calendar.name}</span>
          <CalendarDeleteButton calendarId={calendar.id} calendarName={calendar.name} />
        </div>
      ))}
    </div>
  );
}
