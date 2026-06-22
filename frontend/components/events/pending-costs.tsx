'use client';
import { Button }          from '@/components/ui/button';
import { Input }           from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, X }         from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState }        from 'react';

export type PendingCost = { label: string; amount: number; currency: string };

const CURRENCIES = [
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
] as const;

export const formatAmount = (amount: number, currency: string): string => {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
  return `${symbol}${amount.toFixed(2)}`;
};

export const groupedTotals = (
  costs: Array<{ amount: number; currency: string }>,
): [string, number][] => {
  const map = new Map<string, number>();
  for (const c of costs) {
    map.set(c.currency, (map.get(c.currency) ?? 0) + c.amount);
  }
  return [...map.entries()];
};

export const addPendingCost = (costs: PendingCost[], cost: PendingCost): PendingCost[] => {
  if (!cost.label.trim() || cost.amount <= 0) return costs;
  return [...costs, { ...cost, label: cost.label.trim() }];
};

export const removePendingCost = (costs: PendingCost[], index: number): PendingCost[] =>
  costs.filter((_, i) => i !== index);

type Props = {
  preferredCurrency: string;
  onChange: (costs: PendingCost[]) => void;
};

export const PendingCosts = ({ preferredCurrency, onChange }: Props) => {
  const t = useTranslations('eventCosts');
  const [costs, setCosts] = useState<PendingCost[]>([]);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(preferredCurrency);
  const [open, setOpen] = useState(false);

  const update = (next: PendingCost[]) => {
    setCosts(next);
    onChange(next);
  };

  const handleAdd = () => {
    const n = parseFloat(amount);
    if (!label.trim() || isNaN(n) || n <= 0) return;
    update(addPendingCost(costs, { label, amount: n, currency }));
    setLabel('');
    setAmount('');
    setOpen(false);
  };

  const handleRemove = (index: number) => update(removePendingCost(costs, index));

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
        {costs.map((c, i) => (
          <span
            key={i}
            className='inline-flex items-center gap-1 text-xs rounded-full border bg-muted px-2.5 py-1 font-medium'
          >
            {formatAmount(c.amount, c.currency)} {c.label}
            <button
              type='button'
              aria-label={t('deleteCost')}
              onClick={() => handleRemove(i)}
              className='ml-0.5 text-muted-foreground hover:text-destructive'
            >
              <X className='h-3 w-3' />
            </button>
          </span>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              data-testid='pending-add-cost-trigger'
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
              data-testid='pending-cost-label'
            />
            <div className='flex gap-1.5'>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className='h-8 rounded-md border bg-background px-1.5 text-sm shrink-0 w-[72px]'
                data-testid='pending-cost-currency'
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
                data-testid='pending-cost-amount'
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <Button
              type='button'
              size='sm'
              className='w-full'
              disabled={!label.trim() || !amount || parseFloat(amount) <= 0}
              onClick={handleAdd}
              data-testid='pending-add-cost-button'
            >
              {t('add')}
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
