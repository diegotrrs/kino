import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
}                            from '@/components/ui/card';
import type { Event }        from '@/lib/types';
import { format }            from 'date-fns';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon
}                            from 'lucide-react';
import { EventDeleteButton } from './event-delete-button';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_time);
  const endDate = event.end_time ? new Date(event.end_time) : null;

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <CardTitle className='text-lg'>{event.title}</CardTitle>
          <EventDeleteButton eventId={event.id} eventTitle={event.title} />
        </div>
        {event.description && (
          <CardDescription>{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className='space-y-2 text-sm text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <CalendarIcon className='h-4 w-4' />
          <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className='flex items-center gap-2'>
          <ClockIcon className='h-4 w-4' />
          <span>
            {format(startDate, 'h:mm a')}
            {endDate && ` – ${format(endDate, 'h:mm a')}`}
          </span>
        </div>
        {event.location && (
          <div className='flex items-center gap-2'>
            <MapPinIcon className='h-4 w-4' />
            <span>{event.location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
