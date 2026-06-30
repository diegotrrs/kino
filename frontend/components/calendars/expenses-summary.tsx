'use client';
import {
  addCalendarExpense   as addCalendarExpenseAction,
  deleteCalendarExpense as deleteCalendarExpenseAction,
} from '@/app/(app)/calendars/actions';
import { formatAmount, groupedTotals } from '@/components/events/pending-expenses';
import { Button }                      from '@/components/ui/button';
import { Input }                       from '@/components/ui/input';
import { Separator }                   from '@/components/ui/separator';
import { useEvents }                   from '@/context/events-context';
import type { CalendarEvent }          from '@/utils/data';
import type { CalendarExpense }        from '@/lib/types';
import { Plus, Wallet, X }             from 'lucide-react';
import { useTranslations }             from 'next-intl';
import { useState }                    from 'react';

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

export const ExpensesSummary = () => {
  const {
    events,
    calendarUuid,
    calendarExpenses,
    readOnly,
    preferredCurrency,
    addCalendarExpense: addExpenseToContext,
    removeCalendarExpense,
  } = useEvents();
  const t = useTranslations('eventCosts');

  const [open, setOpen]           = useState(false);
  const [adding, setAdding]       = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [label, setLabel]         = useState('');
  const [amount, setAmount]       = useState('');
  const [currency, setCurrency]   = useState(preferredCurrency);

  const totals = tripTotals(events, calendarExpenses);
  if (totals.length === 0 && calendarExpenses.length === 0) return null;

  const pillLabel = totals.map(([cur, amt]) => formatAmount(amt, cur)).join(' · ');

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
      <button
        type='button'
        aria-label='View trip expenses'
        data-testid='trip-cost-pill'
        onClick={() => setOpen(true)}
        className='inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors'
      >
        <Wallet className='h-3.5 w-3.5' />
        {pillLabel ? `${t('viewExpenses')} · ${pillLabel}` : t('viewExpenses')}
      </button>

      {open && (
        <div
          className='fixed inset-0 z-40'
          aria-hidden='true'
          onClick={() => setOpen(false)}
        />
      )}

      <div
        role='dialog'
        aria-label='Expenses'
        data-testid='trip-cost-drawer'
        className={`fixed top-0 right-0 h-full w-80 bg-background border-l shadow-xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className='flex items-center justify-between px-4 py-3 border-b'>
          <div className='flex items-center gap-2'>
            <Wallet className='h-4 w-4 text-muted-foreground' />
            <span className='font-semibold text-sm'>{t('drawerTitle')}</span>
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
          <div className='px-4 py-3 border-b bg-muted/30 space-y-1'>
            {totals.map(([cur, amt]) => (
              <div key={cur} className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>{cur} total</span>
                <span className='font-semibold' data-testid={`trip-total-${cur}`}>
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
                        className='h-8 rounded-md border bg-background px-1.5 text-sm shrink-0 w-[72px]'
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
                  <div className='text-xs text-muted-foreground mb-0.5'>
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
                      <span>{formatAmount(c.amount, c.currency)}</span>
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
