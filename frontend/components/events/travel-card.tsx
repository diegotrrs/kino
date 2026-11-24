'use client';
import {
  CARD_LABEL,
  ReferenceStub
}                                       from '@/components/events/reference-stub';
import { TrackFlightLink }              from '@/components/events/track-flight-link';
import { TravelModeIcon }               from '@/components/events/travel-strip';
import { getEventTint }                 from '@/lib/event-colors';
import {
  getFlightTrackingUrl,
  getTravelCardDetails
}                                       from '@/lib/travel';
import type {
  TravelDetails,
  TravelMode
}                                       from '@/lib/types';
import { cn }                           from '@/lib/utils';
import { useTranslations }              from 'next-intl';
import type { ReactElement }            from 'react';

const LABEL = CARD_LABEL;
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
  const details = getTravelCardDetails(travelMode, travel);
  const hasRoute = !!travel.origin || !!travel.destination;
  const reference = bookingReference;
  const trackingUrl = travelMode === 'flight' ? getFlightTrackingUrl(travel.number) : null;
  // The stub holds the seat, the reference and Track flight, so any one of them is enough to show it
  const hasStub = !!travel.seat || !!reference || !!trackingUrl;

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
          <div className='mt-auto flex flex-col gap-2'>
            {reference && <ReferenceStub reference={reference} trackedFrom='travel_card' />}
            {trackingUrl && travel.number && <TrackFlightLink url={trackingUrl} number={travel.number} isOnlyAction={!reference} />}
          </div>
        </div>
      )}
    </section>
  );
};
