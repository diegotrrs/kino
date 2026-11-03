'use client';
import {
  addCalendarExpense as addCalendarExpenseAction,
  deleteCalendarExpense as deleteCalendarExpenseAction
}                               from '@/app/(app)/calendars/actions';
import {
  formatAmount,
  groupedTotals
}                               from '@/components/events/pending-expenses';
import { Button }               from '@/components/ui/button';
import { Input }                from '@/components/ui/input';
import { Separator }            from '@/components/ui/separator';
import { useEvents }            from '@/context/events-context';
import type { CalendarExpense } from '@/lib/types';
import { cn }                   from '@/lib/utils';
import type { CalendarEvent }   from '@/utils/data';
import {
  ChevronUp,
  Plus,
  Wallet,
  X
}                               from 'lucide-react';
import { useTranslations }      from 'next-intl';
import { useState }             from 'react';

const CURRENCIES = [
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
] as const;

export const tripTotals = (
  events: CalendarEvent[],
  calendarExpenses: CalendarExpense[] = [],
): [string, number][] =>
  groupedTotals([
    ...events.flatMap((e) => e.expenses ?? []),
    ...calendarExpenses,
  ]);

export type ExpenseBreakdown = {
  currency: string;
  total: number;
  onEvents: number;
  general: number;
  otherTotals: [string, number][];
};

const sumIn = (expenses: Array<{ amount: number; currency: string }>, currency: string): number =>
  expenses.filter((e) => e.currency === currency).reduce((sum, e) => sum + e.amount, 0);

// Leads with the preferred currency when the trip has any spend in it, otherwise the largest total
export const getExpenseBreakdown = (
  events: CalendarEvent[],
  calendarExpenses: CalendarExpense[],
  preferredCurrency: string,
): ExpenseBreakdown | null => {
  const totals = tripTotals(events, calendarExpenses);
  if (totals.length === 0) return null;

  const [currency] = totals.find(([cur]) => cur === preferredCurrency)
    ?? [...totals].sort(([, a], [, b]) => b - a)[0];
  const eventExpenses = events.flatMap((e) => e.expenses ?? []);
  const onEvents = sumIn(eventExpenses, currency);
  const general = sumIn(calendarExpenses, currency);

  return {
    currency,
    total: onEvents + general,
    onEvents,
    general,
    otherTotals: totals.filter(([cur]) => cur !== currency),
  };
};

const useExpenseBreakdown = (): ExpenseBreakdown | null => {
  const { events, calendarExpenses, preferredCurrency } = useEvents();
  return getExpenseBreakdown(events, calendarExpenses, preferredCurrency);
};

export const ExpensesPanel = () => {
  const { calendarExpenses, setExpensesOpen } = useEvents();
  const t = useTranslations('eventCosts');
  const breakdown = useExpenseBreakdown();
  if (!breakdown && calendarExpenses.length === 0) return null;

  return (
      <button
        type='button'
        aria-label={t('viewExpenses')}
        data-testid='trip-cost-pill'
        onClick={() => setExpensesOpen(true)}
        className='grid w-full gap-3 rounded-md border bg-card p-4 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <span className='flex items-center justify-between font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
          {t('title')}
          <Wallet className='h-3.5 w-3.5' />
        </span>
        {breakdown && (
          <>
            <span className='font-mono text-3xl font-medium tracking-tight tabular-nums'>
              {formatAmount(breakdown.total, breakdown.currency)}
            </span>
            {breakdown.otherTotals.length > 0 && (
              <span className='-mt-2 font-mono text-sm text-muted-foreground tabular-nums'>
                {breakdown.otherTotals.map(([cur, amt]) => `+ ${formatAmount(amt, cur)}`).join(' · ')}
              </span>
            )}
            <span className='flex h-1.5 overflow-hidden rounded-full bg-secondary' aria-hidden='true'>
              <span className='bg-teal' style={{ width: `${breakdown.total ? (breakdown.onEvents / breakdown.total) * 100 : 0}%` }} />
              <span className='bg-ev-ochre' style={{ width: `${breakdown.total ? (breakdown.general / breakdown.total) * 100 : 0}%` }} />
            </span>
            <span className='grid gap-1.5 text-sm'>
              <span className='flex items-center justify-between gap-3'>
                <span className='flex items-center gap-2'><span className='h-2 w-2 rounded-full bg-teal' />{t('onEvents')}</span>
                <span className='font-mono tabular-nums'>{formatAmount(breakdown.onEvents, breakdown.currency)}</span>
              </span>
              <span className='flex items-center justify-between gap-3'>
                <span className='flex items-center gap-2'><span className='h-2 w-2 rounded-full bg-ev-ochre' />{t('general')}</span>
                <span className='font-mono tabular-nums'>{formatAmount(breakdown.general, breakdown.currency)}</span>
              </span>
            </span>
          </>
        )}
        <span className='text-xs font-medium text-teal'>{t('viewAll')} →</span>
      </button>
  );
};

// Phones and tablets: floats above the bottom navigation so the spend stays in view while scrolling the calendar
export const ExpensesBar = () => {
  const { calendarExpenses, setExpensesOpen } = useEvents();
  const t = useTranslations('eventCosts');
  const breakdown = useExpenseBreakdown();
  if (!breakdown && calendarExpenses.length === 0) return null;

  return (
    <button
      type='button'
      aria-label={t('viewExpenses')}
      data-testid='trip-cost-bar'
      onClick={() => setExpensesOpen(true)}
      className='fixed inset-x-3 bottom-19 z-30 flex h-13 items-center gap-3 rounded-lg border bg-card px-4 text-left shadow-lg md:bottom-4 md:left-19 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
      <Wallet className='h-4 w-4 shrink-0 text-teal' />
      <span className='font-mono text-base font-medium tabular-nums'>
        {breakdown && formatAmount(breakdown.total, breakdown.currency)}
      </span>
      {breakdown && breakdown.otherTotals.length > 0 && (
        <span className='hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline'>
          {breakdown.otherTotals.map(([cur, amt]) => `+ ${formatAmount(amt, cur)}`).join(' · ')}
        </span>
      )}
      <span className='truncate text-xs text-muted-foreground'>{t('spentSoFar')}</span>
      <span className='ml-auto flex shrink-0 items-center gap-1 text-xs font-medium text-teal'>
        {t('details')}
        <ChevronUp className='h-4 w-4' />
      </span>
    </button>
  );
};

export const ExpensesDrawer = () => {
  const {
    events,
    calendarUuid,
    calendarExpenses,
    readOnly,
    preferredCurrency,
    addCalendarExpense: addExpenseToContext,
    removeCalendarExpense,
    expensesOpen: open,
    setExpensesOpen: setOpen,
  } = useEvents();
  const t = useTranslations('eventCosts');

  const [adding, setAdding]       = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [label, setLabel]         = useState('');
  const [amount, setAmount]       = useState('');
  const [currency, setCurrency]   = useState(preferredCurrency);

  const totals = tripTotals(events, calendarExpenses);
  if (totals.length === 0 && calendarExpenses.length === 0) return null;

  const handleAdd = async () => {
    const n = parseFloat(amount);
    if (!label.trim() || isNaN(n) || n <= 0 || !calendarUuid) return;
    setAdding(true);
    try {
      const expense = await addCalendarExpenseAction(calendarUuid, label.trim(), n, currency);
      addExpenseToContext(expense);
      setLabel('');
      setAmount('');
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!calendarUuid) return;
    await deleteCalendarExpenseAction(calendarUuid, id);
    removeCalendarExpense(id);
  };

  return (
    <>

      {open && (
        <div
          className='fixed inset-0 z-40 bg-black/50 lg:bg-transparent'
          aria-hidden='true'
          onClick={() => setOpen(false)}
        />
      )}

      <div
        role='dialog'
        aria-label='Expenses'
        data-testid='trip-cost-drawer'
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col rounded-t-2xl border-t bg-card shadow-xl transition-transform duration-300',
          'lg:inset-x-auto lg:top-0 lg:right-0 lg:h-full lg:max-h-none lg:w-80 lg:rounded-none lg:border-t-0 lg:border-l',
          open ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full',
        )}
      >
        <span aria-hidden='true' className='mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border lg:hidden' />
        <div className='flex items-center justify-between px-4 py-3 border-b'>
          <div className='flex items-center gap-2'>
            <Wallet className='h-4 w-4 text-muted-foreground' />
            <span className='font-display text-base font-bold'>{t('drawerTitle')}</span>
          </div>
          <button
            aria-label='Close expenses'
            onClick={() => setOpen(false)}
            className='text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {/* Totals strip */}
        {totals.length > 0 && (
          <div className='px-4 py-4 border-b border-dashed space-y-1'>
            {totals.map(([cur, amt]) => (
              <div key={cur} className='flex items-baseline justify-between'>
                <span className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>{cur} total</span>
                <span className='font-mono text-2xl font-medium tracking-tight tabular-nums' data-testid={`trip-total-${cur}`}>
                  {formatAmount(amt, cur)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className='flex-1 overflow-y-auto'>
          {/* General expenses — top (Variant B) */}
          <div className='px-4 py-3 border-b'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-semibold'>{t('generalExpenses')}</span>
              {!readOnly && (
                <button
                  type='button'
                  onClick={() => setShowForm((v) => !v)}
                  className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
                  data-testid='toggle-add-expense'
                >
                  <Plus className='h-3 w-3' />
                  {showForm ? t('cancel') : t('add')}
                </button>
              )}
            </div>

            {readOnly ? (
              <p className='text-xs text-muted-foreground'>{t('readOnlyExpensesMessage')}</p>
            ) : (
              <>
                {showForm && (
                  <div className='space-y-2 mb-3'>
                    <Input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder={t('labelPlaceholder')}
                      className='h-8 text-sm'
                      autoFocus
                      disabled={adding}
                      data-testid='expense-label-input'
                    />
                    <div className='flex gap-1.5'>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className='h-8 rounded-md border bg-card px-1.5 text-sm shrink-0 w-[72px]'
                        disabled={adding}
                        data-testid='expense-currency-select'
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={t('amountPlaceholder')}
                        className='h-8 text-sm tabular-nums'
                        type='number'
                        min='0.01'
                        step='0.01'
                        disabled={adding}
                        data-testid='expense-amount-input'
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      />
                    </div>
                    <Button
                      type='button'
                      size='sm'
                      className='w-full'
                      disabled={adding || !label.trim() || !amount || parseFloat(amount) <= 0}
                      onClick={handleAdd}
                      data-testid='add-expense-button'
                    >
                      {adding ? t('adding') : t('add')}
                    </Button>
                  </div>
                )}
                <div className='flex flex-wrap gap-1.5'>
                  {calendarExpenses.map((expense) => (
                    <span
                      key={expense.id}
                      className='inline-flex items-center gap-1 text-xs rounded-full border bg-muted px-2.5 py-1 font-medium'
                    >
                      {formatAmount(expense.amount, expense.currency)} {expense.label}
                      <button
                        type='button'
                        aria-label={t('deleteExpense')}
                        onClick={() => handleDelete(expense.id)}
                        className='ml-0.5 text-muted-foreground hover:text-destructive'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </span>
                  ))}
                  {calendarExpenses.length === 0 && !showForm && (
                    <p className='text-xs text-muted-foreground'>{t('noGeneralExpenses')}</p>
                  )}
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Per-event breakdown */}
          <div className='px-4 py-3 space-y-4'>
            {events
              .filter((ev) => (ev.expenses ?? []).length > 0)
              .map((ev) => (
                <div key={ev.id}>
                  <div className='font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground mb-0.5'>
                    {new Date(ev.start as Date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  <div className='text-sm font-medium mb-1'>{ev.title}</div>
                  {(ev.expenses ?? []).map((c) => (
                    <div key={c.id} className='flex justify-between text-sm text-muted-foreground pl-2'>
                      <span>{c.label}</span>
                      <span className='font-mono tabular-nums'>{formatAmount(c.amount, c.currency)}</span>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};
