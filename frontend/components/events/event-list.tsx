import { EventTimelineClient } from './event-timeline-client';
import type { Event }          from '@/lib/types';

// Re-exported so event-list.test.ts can import groupByDate without changing its import path
export { groupByDate } from './event-timeline-client';

type EventListProps = {
  events:            Event[];
  preferredCurrency: string;
};

export const EventList = ({ events, preferredCurrency }: EventListProps) => (
  <EventTimelineClient events={events} preferredCurrency={preferredCurrency} />
);
