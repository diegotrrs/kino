import { Separator } from '@/components/ui/separator';
import { EventList } from '@/components/events/event-list';
import { EventCreateDialog } from '@/components/events/event-create-dialog';
import type { Event } from '@/lib/types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000';

async function getEvents(): Promise<Event[]> {
  const res = await fetch(`${API_BASE_URL}/api/events/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch events');
  }

  return res.json();
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className='py-4'>
      <div className='flex flex-col w-full items-center'>
        <div className='w-full px-5 space-y-5'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0'>
              <h2 className='flex items-center text-2xl font-semibold tracking-tight md:text-3xl'>
                Events
              </h2>
              <p className='text-xs md:text-sm font-medium text-muted-foreground'>
                Manage your events — create, view, and delete.
              </p>
            </div>
            <EventCreateDialog />
          </div>

          <Separator />
          <EventList events={events} />
        </div>
      </div>
    </div>
  );
}
