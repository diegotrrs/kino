import { describe, expect, it } from 'vitest';
import { tripTotals }           from './trip-cost-summary';
import type { CalendarEvent }   from '@/utils/data';

const makeEvent = (id: string, costs: { label: string; amount: number; currency: string }[]): CalendarEvent => ({
  id,
  title: `Event ${id}`,
  start: new Date('2025-07-14T08:00:00'),
  end:   new Date('2025-07-14T09:00:00'),
  costs: costs.map((c, i) => ({ id: i, event_id: Number(id), created_at: '', ...c })),
});

describe('tripTotals', () => {
  it('returns empty for events with no costs', () => {
    expect(tripTotals([makeEvent('1', [])])).toEqual([]);
  });

  it('returns empty for an empty events array', () => {
    expect(tripTotals([])).toEqual([]);
  });

  it('sums costs from a single event', () => {
    const events = [makeEvent('1', [
      { label: 'Ticket', amount: 18, currency: 'EUR' },
      { label: 'Guide',  amount: 8,  currency: 'EUR' },
    ])];
    expect(tripTotals(events)).toEqual([['EUR', 26]]);
  });

  it('aggregates costs across multiple events', () => {
    const events = [
      makeEvent('1', [{ label: 'Flight',  amount: 240, currency: 'GBP' }]),
      makeEvent('2', [{ label: 'Hotel',   amount: 450, currency: 'EUR' }]),
      makeEvent('3', [{ label: 'Taxi',    amount: 35,  currency: 'GBP' }]),
    ];
    const result = Object.fromEntries(tripTotals(events));
    expect(result).toEqual({ GBP: 275, EUR: 450 });
  });

  it('handles multiple currencies across multiple events', () => {
    const events = [
      makeEvent('1', [
        { label: 'Flight', amount: 240, currency: 'GBP' },
        { label: 'Hotel',  amount: 450, currency: 'EUR' },
      ]),
      makeEvent('2', [
        { label: 'Taxi',   amount: 35,  currency: 'GBP' },
        { label: 'Dinner', amount: 68,  currency: 'EUR' },
        { label: 'Coffee', amount: 5,   currency: 'USD' },
      ]),
    ];
    const result = Object.fromEntries(tripTotals(events));
    expect(result).toEqual({ GBP: 275, EUR: 518, USD: 5 });
  });

  it('handles events with undefined costs gracefully', () => {
    const event = { ...makeEvent('1', []), costs: undefined } as unknown as CalendarEvent;
    expect(tripTotals([event])).toEqual([]);
  });

  it('preserves insertion order of currencies', () => {
    const events = [
      makeEvent('1', [{ label: 'A', amount: 1, currency: 'EUR' }]),
      makeEvent('2', [{ label: 'B', amount: 2, currency: 'GBP' }]),
    ];
    const [first, second] = tripTotals(events);
    expect(first[0]).toBe('EUR');
    expect(second[0]).toBe('GBP');
  });
});
