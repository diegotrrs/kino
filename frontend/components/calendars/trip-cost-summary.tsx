'use client';
import { formatAmount, groupedTotals } from '@/components/events/pending-costs';
import { useEvents }                   from '@/context/events-context';
import type { CalendarEvent }          from '@/utils/data';
import { Wallet, X }                   from 'lucide-react';
import { useTranslations }             from 'next-intl';
import { useState }                    from 'react';

export const tripTotals = (events: CalendarEvent[]) =>
  groupedTotals(events.flatMap((e) => e.costs ?? []));

export const TripCostSummary = () => {
  const { events } = useEvents();
  const t = useTranslations('eventCosts');
  const [open, setOpen] = useState(false);

  const totals = tripTotals(events);
  if (totals.length === 0) return null;

  const pillLabel = totals.map(([cur, amt]) => formatAmount(amt, cur)).join(' · ');

  return (
    <>
      <button
        type='button'
        aria-label='View trip costs'
        data-testid='trip-cost-pill'
        onClick={() => setOpen(true)}
        className='inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors'
      >
        <Wallet className='h-3.5 w-3.5' />
        {t('viewExpenses')} · {pillLabel}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className='fixed inset-0 z-40'
          aria-hidden='true'
          onClick={() => setOpen(false)}
        />
      )}

      {/* Right drawer */}
      <div
        role='dialog'
        aria-label='Trip budget'
        data-testid='trip-cost-drawer'
        className={`fixed top-0 right-0 h-full w-80 bg-background border-l shadow-xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className='flex items-center justify-between px-4 py-3 border-b'>
          <div className='flex items-center gap-2'>
            <Wallet className='h-4 w-4 text-muted-foreground' />
            <span className='font-semibold text-sm'>Trip budget</span>
          </div>
          <button
            aria-label='Close trip budget'
            onClick={() => setOpen(false)}
            className='text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {/* Totals */}
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

        {/* Per-event breakdown */}
        <div className='flex-1 overflow-y-auto px-4 py-3 space-y-4'>
          {events
            .filter((ev) => (ev.costs ?? []).length > 0)
            .map((ev) => (
              <div key={ev.id}>
                <div className='text-xs text-muted-foreground mb-0.5'>
                  {new Date(ev.start as Date).toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })}
                </div>
                <div className='text-sm font-medium mb-1'>{ev.title}</div>
                {(ev.costs ?? []).map((c) => (
                  <div key={c.id} className='flex justify-between text-sm text-muted-foreground pl-2'>
                    <span>{c.label}</span>
                    <span>{formatAmount(c.amount, c.currency)}</span>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </>
  );
};
