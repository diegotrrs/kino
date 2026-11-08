'use client';
import { addEventExpense, deleteEventExpense } from '@/app/(app)/events/actions';
import { Button }                              from '@/components/ui/button';
import { Input }                               from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { EventExpense }                   from '@/lib/types';
import { Plus, X }                             from 'lucide-react';
import { useTranslations }                     from 'next-intl';
import { useState }                            from 'react';
import { formatAmount, groupedTotals }         from './pending-expenses';

const CURRENCIES = [
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
] as const;

type Props = {
  eventId: number;
  initialExpenses: EventExpense[];
  readOnly?: boolean;
  preferredCurrency: string;
  onExpensesChange?: (expenses: EventExpense[]) => void;
};

export const EventExpenses = ({
  eventId,
  initialExpenses,
  readOnly = false,
  preferredCurrency,
  onExpensesChange,
}: Props) => {
  const t = useTranslations('eventCosts');
  const [expenses, setExpenses] = useState<EventExpense[]>(initialExpenses);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(preferredCurrency);
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);

  const update = (next: EventExpense[]) => {
    setExpenses(next);
    onExpensesChange?.(next);
  };

  const handleAdd = async () => {
    const n = parseFloat(amount);
    if (!label.trim() || isNaN(n) || n <= 0) return;
    setIsAdding(true);
    try {
      const newExpense = await addEventExpense(eventId, label.trim(), n, currency);
      update([...expenses, newExpense]);
      setLabel('');
      setAmount('');
      setOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (expenseId: number) => {
    await deleteEventExpense(eventId, expenseId);
    update(expenses.filter((e) => e.id !== expenseId));
  };

  const totals = groupedTotals(expenses);

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <p className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>{t('title')}</p>
        {totals.length > 0 && (
          <span className='font-mono text-xs font-medium text-teal tabular-nums'>
            {totals.map(([code, total]) => formatAmount(total, code)).join(' · ')}
          </span>
        )}
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {expenses.map((e) => (
          <span
            key={e.id}
            className='inline-flex items-center gap-1 text-xs rounded-full border bg-muted px-2.5 py-1 font-medium'
          >
            {formatAmount(e.amount, e.currency)} {e.label}
            {!readOnly && (
              <button
                type='button'
                aria-label={t('deleteExpense')}
                data-testid='delete-expense-button'
                onClick={() => handleDelete(e.id)}
                className='ml-0.5 text-muted-foreground hover:text-destructive'
              >
                <X className='h-3 w-3' />
              </button>
            )}
          </span>
        ))}
        {!readOnly && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type='button'
                data-testid='add-expense-trigger'
                className='inline-flex items-center gap-1 text-xs rounded-full border border-dashed px-2.5 py-1 text-muted-foreground hover:border-solid hover:text-foreground transition-colors'
              >
                <Plus className='h-3 w-3' /> {t('add')}
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-56 p-3 space-y-2'>
              <p className='text-xs font-semibold'>{t('title')}</p>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('labelPlaceholder')}
                className='h-8 text-sm'
                autoFocus
                disabled={isAdding}
                data-testid='expense-label-input'
              />
              <div className='flex gap-1.5'>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className='h-8 rounded-md border bg-background px-1.5 text-sm shrink-0 w-[72px]'
                  disabled={isAdding}
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
                  disabled={isAdding}
                  data-testid='expense-amount-input'
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <Button
                type='button'
                size='sm'
                className='w-full'
                disabled={isAdding || !label.trim() || !amount || parseFloat(amount) <= 0}
                onClick={handleAdd}
                data-testid='add-expense-button'
              >
                {isAdding ? t('adding') : t('add')}
              </Button>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};
