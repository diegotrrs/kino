import type { Event } from '@/lib/types';
import { EventCard }  from './event-card';

type EventListProps = {
  events: Event[];
}

export const EventList = ({ events }: EventListProps) => {
  if (events.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center'>
        <p className='text-lg font-medium'>No events yet</p>
        <p className='text-sm text-muted-foreground'>
          Create your first event to get started.
        </p>
      </div>
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
