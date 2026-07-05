import { describe, expect, it } from 'vitest';
import { groupByDate }          from './event-list';
import type { Event }           from '@/lib/types';

const makeEvent = (
  id: number,
  date: string,
  start_time: string,
  title = `Event ${id}`,
): Event => ({
  id,
  uuid: `uuid-${id}`,
  calendar_id: 1,
  title,
  description: null,
  date,
  start_time,
  end_date: null,
  end_time: null,
  location: null,
  color: '#AEC6E4',
  created_at: '',
  updated_at: null,
  links: [],
  expenses: [],
});

describe('groupByDate', () => {
  it('should return an empty array for an empty event list', () => {
    expect(groupByDate([])).toEqual([]);
  });

  it('should return a single group for a single event', () => {
    const events = [makeEvent(1, '2026-07-14', '10:00:00')];
    const result = groupByDate(events);
    expect(result).toHaveLength(1);
    expect(result[0][0]).toBe('2026-07-14');
    expect(result[0][1]).toHaveLength(1);
  });

  it('should group events on the same date into one bucket', () => {
    const events = [
      makeEvent(1, '2026-07-14', '10:00:00'),
      makeEvent(2, '2026-07-14', '14:00:00'),
      makeEvent(3, '2026-07-14', '09:00:00'),
    ];
    const result = groupByDate(events);
    expect(result).toHaveLength(1);
    expect(result[0][1]).toHaveLength(3);
  });

  it('should sort events within a date by start_time ascending', () => {
    const events = [
      makeEvent(1, '2026-07-14', '14:00:00', 'Afternoon'),
      makeEvent(2, '2026-07-14', '09:00:00', 'Morning'),
      makeEvent(3, '2026-07-14', '21:00:00', 'Evening'),
    ];
    const [, dayEvents] = groupByDate(events)[0];
    expect(dayEvents.map((e) => e.title)).toEqual(['Morning', 'Afternoon', 'Evening']);
  });

  it('should create a separate group for each distinct date', () => {
    const events = [
      makeEvent(1, '2026-07-14', '10:00:00'),
      makeEvent(2, '2026-07-15', '10:00:00'),
      makeEvent(3, '2026-07-16', '10:00:00'),
    ];
    const result = groupByDate(events);
    expect(result).toHaveLength(3);
    expect(result.map(([d]) => d)).toEqual(['2026-07-14', '2026-07-15', '2026-07-16']);
  });

  it('should order date groups chronologically regardless of input order', () => {
    const events = [
      makeEvent(1, '2026-07-16', '10:00:00'),
      makeEvent(2, '2026-07-14', '10:00:00'),
      makeEvent(3, '2026-07-15', '10:00:00'),
    ];
    const result = groupByDate(events);
    expect(result.map(([d]) => d)).toEqual(['2026-07-14', '2026-07-15', '2026-07-16']);
  });

  it('should not mutate the original events array', () => {
    const events = [
      makeEvent(1, '2026-07-16', '10:00:00'),
      makeEvent(2, '2026-07-14', '10:00:00'),
    ];
    const original = [...events];
    groupByDate(events);
    expect(events).toEqual(original);
  });

  it('should correctly assign events to their respective date groups', () => {
    const events = [
      makeEvent(1, '2026-07-14', '10:00:00', 'Morning on 14th'),
      makeEvent(2, '2026-07-15', '09:00:00', 'Morning on 15th'),
      makeEvent(3, '2026-07-14', '18:00:00', 'Evening on 14th'),
    ];
    const result = groupByDate(events);

    expect(result).toHaveLength(2);

    const [date14, events14] = result[0];
    expect(date14).toBe('2026-07-14');
    expect(events14.map((e) => e.title)).toEqual(['Morning on 14th', 'Evening on 14th']);

    const [date15, events15] = result[1];
    expect(date15).toBe('2026-07-15');
    expect(events15.map((e) => e.title)).toEqual(['Morning on 15th']);
  });
});
