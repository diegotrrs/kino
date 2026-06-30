import { describe, expect, it } from 'vitest';
import {
  addPendingExpense,
  formatAmount,
  groupedTotals,
  removePendingExpense,
  type PendingExpense,
} from './pending-expenses';

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
  it('returns empty array for no expenses', () => {
    expect(groupedTotals([])).toEqual([]);
  });

  it('returns a single entry for a single expense', () => {
    const result = groupedTotals([{ amount: 5, currency: 'GBP' }]);
    expect(result).toEqual([['GBP', 5]]);
  });

  it('sums expenses in the same currency', () => {
    const expenses = [
      { amount: 2.5, currency: 'GBP' },
      { amount: 4, currency: 'GBP' },
    ];
    expect(groupedTotals(expenses)).toEqual([['GBP', 6.5]]);
  });

  it('groups by currency and returns separate totals', () => {
    const expenses = [
      { amount: 6.5, currency: 'GBP' },
      { amount: 45, currency: 'EUR' },
      { amount: 30, currency: 'USD' },
    ];
    const result = groupedTotals(expenses);
    expect(result).toHaveLength(3);
    expect(Object.fromEntries(result)).toEqual({ GBP: 6.5, EUR: 45, USD: 30 });
  });

  it('preserves insertion order of currencies', () => {
    const expenses = [
      { amount: 1, currency: 'EUR' },
      { amount: 2, currency: 'GBP' },
    ];
    const [first, second] = groupedTotals(expenses);
    expect(first[0]).toBe('EUR');
    expect(second[0]).toBe('GBP');
  });
});

describe('addPendingExpense', () => {
  const base: PendingExpense[] = [];

  it('adds a valid expense to an empty list', () => {
    const result = addPendingExpense(base, { label: 'Coffee', amount: 2.5, currency: 'GBP' });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ label: 'Coffee', amount: 2.5, currency: 'GBP' });
  });

  it('trims whitespace from the label', () => {
    const result = addPendingExpense(base, { label: '  Coffee  ', amount: 2.5, currency: 'GBP' });
    expect(result[0].label).toBe('Coffee');
  });

  it('rejects an expense with empty label', () => {
    const result = addPendingExpense(base, { label: '', amount: 2.5, currency: 'GBP' });
    expect(result).toBe(base);
  });

  it('rejects an expense with whitespace-only label', () => {
    const result = addPendingExpense(base, { label: '   ', amount: 2.5, currency: 'GBP' });
    expect(result).toBe(base);
  });

  it('rejects an expense with zero amount', () => {
    const result = addPendingExpense(base, { label: 'Coffee', amount: 0, currency: 'GBP' });
    expect(result).toBe(base);
  });

  it('rejects an expense with negative amount', () => {
    const result = addPendingExpense(base, { label: 'Coffee', amount: -1, currency: 'GBP' });
    expect(result).toBe(base);
  });

  it('appends to an existing list without mutating it', () => {
    const existing: PendingExpense[] = [{ label: 'Tea', amount: 1, currency: 'GBP' }];
    const result = addPendingExpense(existing, { label: 'Coffee', amount: 2.5, currency: 'GBP' });
    expect(result).toHaveLength(2);
    expect(existing).toHaveLength(1);
  });
});

describe('removePendingExpense', () => {
  const expenses: PendingExpense[] = [
    { label: 'Coffee', amount: 2.5, currency: 'GBP' },
    { label: 'Ticket', amount: 10, currency: 'EUR' },
  ];

  it('removes the expense at the given index', () => {
    const result = removePendingExpense(expenses, 0);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Ticket');
  });

  it('removes the last expense', () => {
    const result = removePendingExpense(expenses, 1);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Coffee');
  });

  it('does not mutate the original array', () => {
    removePendingExpense(expenses, 0);
    expect(expenses).toHaveLength(2);
  });
});
