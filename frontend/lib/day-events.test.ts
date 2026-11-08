import { describe, expect, it } from 'vitest';
import type { CalendarEvent } from '@/utils/data';
import { getEventsOnDay } from './day-events';

const makeEvent = (id: string, start: string, end: string): CalendarEvent => ({
  id,
  title: `Event ${id}`,
  start: new Date(start),
  end: new Date(end),
});

describe('getEventsOnDay', () => {
  const day = new Date('2026-11-06T12:00:00');

  it('should return only the events that happen on the given day, sorted by start time', () => {
    const events = [
      makeEvent('late', '2026-11-06T19:00:00', '2026-11-06T20:00:00'),
      makeEvent('other-day', '2026-11-07T09:00:00', '2026-11-07T10:00:00'),
      makeEvent('early', '2026-11-06T08:00:00', '2026-11-06T09:00:00'),
    ];

    expect(getEventsOnDay(events, day).map((e) => e.id)).toEqual(['early', 'late']);
  });

  it('should include a multi-day event on every day it spans', () => {
    const trip = makeEvent('trip', '2026-11-05T10:00:00', '2026-11-07T10:00:00');

    expect(getEventsOnDay([trip], day).map((e) => e.id)).toEqual(['trip']);
  });

  it('should not include an event that ends exactly at the start of the day', () => {
    const previous = makeEvent('previous', '2026-11-05T22:00:00', '2026-11-06T00:00:00');

    expect(getEventsOnDay([previous], day)).toEqual([]);
  });

  it('should include an event with no duration that starts during the day', () => {
    const instant = makeEvent('instant', '2026-11-06T10:00:00', '2026-11-06T10:00:00');

    expect(getEventsOnDay([instant], day).map((e) => e.id)).toEqual(['instant']);
  });
});
