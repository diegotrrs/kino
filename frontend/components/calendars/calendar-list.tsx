import type { Calendar }  from '@/lib/types';
import { CalendarCard }   from './calendar-card';

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
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {calendars.map((calendar) => (
        <CalendarCard key={calendar.id} calendar={calendar} />
      ))}
    </div>
  );
}
