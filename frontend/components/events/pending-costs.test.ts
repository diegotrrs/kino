import { describe, expect, it } from 'vitest';
import {
  addPendingCost,
  formatAmount,
  groupedTotals,
  removePendingCost,
  type PendingCost,
} from './pending-costs';

describe('formatAmount', () => {
  it('formats GBP with £ symbol', () => {
    expect(formatAmount(2.5, 'GBP')).toBe('£2.50');
  });

  it('formats EUR with € symbol', () => {
    expect(formatAmount(45, 'EUR')).toBe('€45.00');
  });

  it('formats USD with $ symbol', () => {
    expect(formatAmount(10.99, 'USD')).toBe('$10.99');
  });

  it('uses currency code as fallback for unknown currencies', () => {
    expect(formatAmount(1, 'JPY')).toBe('JPY1.00');
  });

  it('always shows two decimal places', () => {
    expect(formatAmount(1, 'GBP')).toBe('£1.00');
    expect(formatAmount(1.1, 'GBP')).toBe('£1.10');
  });
});

describe('groupedTotals', () => {
  it('returns empty array for no costs', () => {
    expect(groupedTotals([])).toEqual([]);
  });

  it('returns a single entry for a single cost', () => {
    const result = groupedTotals([{ amount: 5, currency: 'GBP' }]);
    expect(result).toEqual([['GBP', 5]]);
  });

  it('sums costs in the same currency', () => {
    const costs = [
      { amount: 2.5, currency: 'GBP' },
      { amount: 4, currency: 'GBP' },
    ];
    expect(groupedTotals(costs)).toEqual([['GBP', 6.5]]);
  });

  it('groups by currency and returns separate totals', () => {
    const costs = [
      { amount: 6.5, currency: 'GBP' },
      { amount: 45, currency: 'EUR' },
      { amount: 30, currency: 'USD' },
    ];
    const result = groupedTotals(costs);
    expect(result).toHaveLength(3);
    expect(Object.fromEntries(result)).toEqual({ GBP: 6.5, EUR: 45, USD: 30 });
  });

  it('preserves insertion order of currencies', () => {
    const costs = [
      { amount: 1, currency: 'EUR' },
      { amount: 2, currency: 'GBP' },
    ];
    const [first, second] = groupedTotals(costs);
    expect(first[0]).toBe('EUR');
    expect(second[0]).toBe('GBP');
  });
});

describe('addPendingCost', () => {
  const base: PendingCost[] = [];

  it('adds a valid cost to an empty list', () => {
    const result = addPendingCost(base, { label: 'Coffee', amount: 2.5, currency: 'GBP' });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ label: 'Coffee', amount: 2.5, currency: 'GBP' });
  });

  it('trims whitespace from the label', () => {
    const result = addPendingCost(base, { label: '  Coffee  ', amount: 2.5, currency: 'GBP' });
    expect(result[0].label).toBe('Coffee');
  });

  it('rejects a cost with empty label', () => {
    const result = addPendingCost(base, { label: '', amount: 2.5, currency: 'GBP' });
    expect(result).toBe(base);
  });

  it('rejects a cost with whitespace-only label', () => {
    const result = addPendingCost(base, { label: '   ', amount: 2.5, currency: 'GBP' });
    expect(result).toBe(base);
  });

  it('rejects a cost with zero amount', () => {
    const result = addPendingCost(base, { label: 'Coffee', amount: 0, currency: 'GBP' });
    expect(result).toBe(base);
  });

  it('rejects a cost with negative amount', () => {
    const result = addPendingCost(base, { label: 'Coffee', amount: -1, currency: 'GBP' });
    expect(result).toBe(base);
  });

  it('appends to an existing list without mutating it', () => {
    const existing: PendingCost[] = [{ label: 'Tea', amount: 1, currency: 'GBP' }];
    const result = addPendingCost(existing, { label: 'Coffee', amount: 2.5, currency: 'GBP' });
    expect(result).toHaveLength(2);
    expect(existing).toHaveLength(1);
  });
});

describe('removePendingCost', () => {
  const costs: PendingCost[] = [
    { label: 'Coffee', amount: 2.5, currency: 'GBP' },
    { label: 'Ticket', amount: 10, currency: 'EUR' },
  ];

  it('removes the cost at the given index', () => {
    const result = removePendingCost(costs, 0);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Ticket');
  });

  it('removes the last cost', () => {
    const result = removePendingCost(costs, 1);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Coffee');
  });

  it('does not mutate the original array', () => {
    removePendingCost(costs, 0);
    expect(costs).toHaveLength(2);
  });
});
