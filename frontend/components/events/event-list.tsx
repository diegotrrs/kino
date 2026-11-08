import type { Event }          from '@/lib/types';
import { EventTimelineClient } from './event-timeline-client';

// Re-exported so event-list.test.ts can import groupByDate without changing its import path
export { groupByDate } from './event-timeline-client';

type EventListProps = {
  events:              Event[];
  preferredCurrency:   string;
  dayNamesByCalendar?: Record<number, Record<string, string>>;
};

export const EventList = ({ events, preferredCurrency, dayNamesByCalendar }: EventListProps) => (
  <EventTimelineClient events={events} preferredCurrency={preferredCurrency} dayNamesByCalendar={dayNamesByCalendar} />
);
