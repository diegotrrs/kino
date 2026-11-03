import { describe, expect, it } from 'vitest';
import { getExpenseBreakdown, tripTotals } from './expenses-summary';
import type { CalendarEvent }   from '@/utils/data';
import type { CalendarExpense } from '@/lib/types';

const makeEvent = (id: string, costs: { label: string; amount: number; currency: string }[]): CalendarEvent => ({
  id,
  title: `Event ${id}`,
  start: new Date('2025-07-14T08:00:00'),
  end:   new Date('2025-07-14T09:00:00'),
  expenses: costs.map((c, i) => ({ id: i, event_id: Number(id), created_at: '', ...c })),
});

const makeExpense = (id: number, amount: number, currency: string): CalendarExpense => ({
  id,
  calendar_id: 1,
  label: `Expense ${id}`,
  amount,
  currency,
  created_at: '',
});

describe('tripTotals', () => {
  it('returns empty for events with no costs and no calendar expenses', () => {
    expect(tripTotals([makeEvent('1', [])], [])).toEqual([]);
  });

  it('returns empty for an empty events array and no calendar expenses', () => {
    expect(tripTotals([], [])).toEqual([]);
  });

  it('sums costs from a single event', () => {
    const events = [makeEvent('1', [
      { label: 'Ticket', amount: 18, currency: 'EUR' },
      { label: 'Guide',  amount: 8,  currency: 'EUR' },
    ])];
    expect(tripTotals(events, [])).toEqual([['EUR', 26]]);
  });

  it('aggregates costs across multiple events', () => {
    const events = [
      makeEvent('1', [{ label: 'Flight', amount: 240, currency: 'GBP' }]),
      makeEvent('2', [{ label: 'Hotel',  amount: 450, currency: 'EUR' }]),
      makeEvent('3', [{ label: 'Taxi',   amount: 35,  currency: 'GBP' }]),
    ];
    const result = Object.fromEntries(tripTotals(events, []));
    expect(result).toEqual({ GBP: 275, EUR: 450 });
  });

  it('includes calendar expenses in the totals', () => {
    const events = [makeEvent('1', [{ label: 'Flight', amount: 200, currency: 'GBP' }])];
    const expenses = [makeExpense(1, 62, 'GBP'), makeExpense(2, 45, 'EUR')];
    const result = Object.fromEntries(tripTotals(events, expenses));
    expect(result).toEqual({ GBP: 262, EUR: 45 });
  });

  it('aggregates mixed event costs and calendar expenses across currencies', () => {
    const events = [
      makeEvent('1', [{ label: 'Hotel', amount: 300, currency: 'EUR' }]),
    ];
    const expenses = [
      makeExpense(1, 62, 'GBP'),
      makeExpense(2, 50, 'EUR'),
    ];
    const result = Object.fromEntries(tripTotals(events, expenses));
    expect(result).toEqual({ EUR: 350, GBP: 62 });
  });

  it('handles only calendar expenses with no event costs', () => {
    const expenses = [makeExpense(1, 80, 'USD'), makeExpense(2, 40, 'USD')];
    expect(tripTotals([], expenses)).toEqual([['USD', 120]]);
  });

  it('handles events with undefined expenses gracefully', () => {
    const event = { ...makeEvent('1', []), expenses: undefined } as unknown as CalendarEvent;
    expect(tripTotals([event], [])).toEqual([]);
  });

  it('preserves insertion order of currencies', () => {
    const events = [
      makeEvent('1', [{ label: 'A', amount: 1, currency: 'EUR' }]),
      makeEvent('2', [{ label: 'B', amount: 2, currency: 'GBP' }]),
    ];
    const [first, second] = tripTotals(events, []);
    expect(first[0]).toBe('EUR');
    expect(second[0]).toBe('GBP');
  });
});

describe('getExpenseBreakdown', () => {
  it('should return null when the trip has no expenses', () => {
    expect(getExpenseBreakdown([makeEvent('1', [])], [], 'GBP')).toBeNull();
  });

  it('should split the preferred currency total into event and general expenses', () => {
    const events = [makeEvent('1', [{ label: 'Ticket', amount: 200, currency: 'GBP' }])];
    const breakdown = getExpenseBreakdown(events, [makeExpense(1, 62, 'GBP')], 'GBP');

    expect(breakdown).toMatchObject({ currency: 'GBP', total: 262, onEvents: 200, general: 62, otherTotals: [] });
  });

  it('should list totals in other currencies separately from the leading currency', () => {
    const events = [makeEvent('1', [{ label: 'Room', amount: 300, currency: 'EUR' }])];
    const breakdown = getExpenseBreakdown(events, [makeExpense(1, 62, 'GBP')], 'GBP');

    expect(breakdown?.currency).toBe('GBP');
    expect(breakdown?.otherTotals).toEqual([['EUR', 300]]);
  });

  it('should lead with the largest total when nothing was spent in the preferred currency', () => {
    const events = [makeEvent('1', [{ label: 'Room', amount: 300, currency: 'EUR' }])];
    const breakdown = getExpenseBreakdown(events, [makeExpense(1, 40, 'USD')], 'GBP');

    expect(breakdown?.currency).toBe('EUR');
    expect(breakdown?.otherTotals).toEqual([['USD', 40]]);
  });
});
