import type { CalendarEvent } from '@/utils/data';

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// An event belongs to a day when any part of it falls inside that day, so multi-day events show on each day they span
export const getEventsOnDay = (events: CalendarEvent[], day: Date): CalendarEvent[] => {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  return events
    .filter((event) => {
      const start = new Date(event.start).getTime();
      const end = new Date(event.end ?? event.start).getTime();
      return start < dayEnd && (end > dayStart || start >= dayStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};
