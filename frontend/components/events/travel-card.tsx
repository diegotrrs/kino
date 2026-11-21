'use client';
import { TravelModeIcon }               from '@/components/events/travel-strip';
import { useCopyToClipboard }           from '@/hooks/use-copy-to-clipboard';
import { getEventTint }                 from '@/lib/event-colors';
import { getTravelCardDetails }         from '@/lib/travel';
import type {
  TravelDetails,
  TravelMode
}                                       from '@/lib/types';
import { cn }                           from '@/lib/utils';
import { useTranslations }              from 'next-intl';
import type { ReactElement }            from 'react';

const LABEL = 'font-mono text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground';
const PLACE = 'font-display text-3xl font-extrabold leading-none tracking-tight sm:text-4xl';

type TravelCardProps = {
  travelMode: TravelMode;
  travel: TravelDetails;
  bookingReference: string | null;
  departs: string;
  arrives: string;
  color: string;
};

// Direction A of the prototypes: a boarding pass at the top of the event dialog. From `sm` it's a ticket
// with a perforated stub on the right; on phones the stub drops below (direction E).
export const TravelCard = ({ travelMode, travel, bookingReference, departs, arrives, color }: TravelCardProps): ReactElement => {
  const t = useTranslations('travel');
  const { isCopied, copy } = useCopyToClipboard();
  const details = getTravelCardDetails(travelMode, travel);
  const hasRoute = !!travel.origin || !!travel.destination;
  const reference = bookingReference;
  const hasStub = !!travel.seat || !!reference;

  return (
    <section
      aria-label={t(travelMode === 'flight' ? 'card.flightTicket' : 'card.trainTicket')}
      data-testid='travel-card'
      className='relative flex flex-col rounded-md border bg-card sm:flex-row'
    >
      <div className='flex min-w-0 flex-1 flex-col gap-4 p-4'>
        <span className='flex items-center gap-2'>
          <span style={{ color }}><TravelModeIcon travelMode={travelMode} className='h-4 w-4' /></span>
          <span className='font-mono text-sm font-medium tracking-wide'>{travel.number ?? t(travelMode)}</span>
        </span>

        {hasRoute && (
          <div className='flex items-end gap-3'>
            <span className='flex min-w-0 flex-col gap-1.5'>
              <span className={cn(PLACE, 'break-words')}>{travel.origin ?? '—'}</span>
              <span className='font-mono text-sm tabular-nums text-muted-foreground'>{departs}</span>
            </span>
            <span aria-hidden='true' style={{ borderTopColor: color }} className='mb-8 min-w-6 flex-1 border-t-2 border-dashed' />
            <span className='flex min-w-0 flex-col items-end gap-1.5 text-right'>
              <span className={cn(PLACE, 'break-words')}>{travel.destination ?? '—'}</span>
              <span className='font-mono text-sm tabular-nums text-muted-foreground'>{arrives}</span>
            </span>
          </div>
        )}

        {details.length > 0 && (
          <dl className='flex flex-wrap gap-x-8 gap-y-3 border-t pt-3'>
            {details.map((detail) => (
              <div key={detail.field} className='flex flex-col gap-1.5'>
                <dt className={LABEL}>{t(`fields.${detail.field}`)}</dt>
                <dd className='font-mono text-lg font-medium leading-none'>{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {hasStub && (
        <div
          style={{ backgroundColor: getEventTint(color, 10) }}
          className='relative flex flex-col justify-between gap-4 rounded-b-md border-t-2 border-dashed p-4 sm:w-44 sm:shrink-0 sm:rounded-r-md sm:rounded-bl-none sm:border-t-0 sm:border-l-2'
        >
          {/* The perforation's notches, where the stub tears off */}
          <span aria-hidden='true' className='absolute -top-2 -left-2 hidden h-3.5 w-3.5 rounded-full border bg-background sm:block' />
          <span aria-hidden='true' className='absolute -bottom-2 -left-2 hidden h-3.5 w-3.5 rounded-full border bg-background sm:block' />
          {travel.seat && (
            <div className='flex flex-col gap-1.5'>
              <span className={LABEL}>{t('fields.seat')}</span>
              <span className={PLACE}>{travel.seat}</span>
            </div>
          )}
          {reference && (
            <div className='flex flex-col gap-2'>
              <span className={LABEL}>{t('fields.booking_reference')}</span>
              <span className='font-mono text-lg font-medium leading-none tracking-[0.12em]'>{reference}</span>
              <button
                type='button'
                onClick={() => void copy(reference)}
                aria-label={t('copyReference', { reference })}
                className={cn(
                  'h-11 w-full rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'sm:h-8 sm:w-fit sm:border sm:bg-card sm:text-xs sm:font-medium sm:text-foreground sm:hover:bg-secondary',
                )}
              >
                <span aria-live='polite'>
                  {isCopied ? t('copied') : <><span className='sm:hidden'>{t('card.copyReference')}</span><span className='hidden sm:inline'>{t('card.copy')}</span></>}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
