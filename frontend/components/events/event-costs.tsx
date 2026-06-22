'use client';
import { addEventCost, deleteEventCost } from '@/app/(app)/events/actions';
import { Button }                        from '@/components/ui/button';
import { Input }                         from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { EventCost }                from '@/lib/types';
import { Plus, X }                       from 'lucide-react';
import { useTranslations }               from 'next-intl';
import { useState }                      from 'react';
import { formatAmount, groupedTotals }   from './pending-costs';

const CURRENCIES = [
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
] as const;

type Props = {
  eventId: number;
  initialCosts: EventCost[];
  readOnly?: boolean;
  preferredCurrency: string;
  onCostsChange?: (costs: EventCost[]) => void;
};

export const EventCosts = ({
  eventId,
  initialCosts,
  readOnly = false,
  preferredCurrency,
  onCostsChange,
}: Props) => {
  const t = useTranslations('eventCosts');
  const [costs, setCosts] = useState<EventCost[]>(initialCosts);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(preferredCurrency);
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);

  const update = (next: EventCost[]) => {
    setCosts(next);
    onCostsChange?.(next);
  };

  const handleAdd = async () => {
    const n = parseFloat(amount);
    if (!label.trim() || isNaN(n) || n <= 0) return;
    setIsAdding(true);
    try {
      const newCost = await addEventCost(eventId, label.trim(), n, currency);
      update([...costs, newCost]);
      setLabel('');
      setAmount('');
      setOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (costId: number) => {
    await deleteEventCost(eventId, costId);
    update(costs.filter((c) => c.id !== costId));
  };

  const totals = groupedTotals(costs);

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium leading-none'>{t('title')}</p>
        {totals.length > 0 && (
          <span className='text-xs font-bold bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 tabular-nums'>
            {totals.map(([code, total]) => formatAmount(total, code)).join(' · ')}
          </span>
        )}
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {costs.map((c) => (
          <span
            key={c.id}
            className='inline-flex items-center gap-1 text-xs rounded-full border bg-muted px-2.5 py-1 font-medium'
          >
            {formatAmount(c.amount, c.currency)} {c.label}
            {!readOnly && (
              <button
                type='button'
                aria-label={t('deleteCost')}
                data-testid='delete-cost-button'
                onClick={() => handleDelete(c.id)}
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
                data-testid='add-cost-trigger'
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
                data-testid='cost-label-input'
              />
              <div className='flex gap-1.5'>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className='h-8 rounded-md border bg-background px-1.5 text-sm shrink-0 w-[72px]'
                  disabled={isAdding}
                  data-testid='cost-currency-select'
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
                  data-testid='cost-amount-input'
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <Button
                type='button'
                size='sm'
                className='w-full'
                disabled={isAdding || !label.trim() || !amount || parseFloat(amount) <= 0}
                onClick={handleAdd}
                data-testid='add-cost-button'
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
