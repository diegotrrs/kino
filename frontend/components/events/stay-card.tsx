'use client';
import { AddressLink }      from '@/components/events/address-link';
import {
  CARD_LABEL,
  ReferenceStub
}                           from '@/components/events/reference-stub';
import { TravelModeIcon }   from '@/components/events/travel-strip';
import { getEventTint }     from '@/lib/event-colors';
import { cn }               from '@/lib/utils';
import { useTranslations }  from 'next-intl';
import type { ReactElement } from 'react';

const DAY = 'font-display text-2xl font-extrabold leading-none tracking-tight sm:text-3xl';

// e.g. { date: 'NOV 22', weekday: 'SUN', time: '15:00' }, already in the app's language
type StayMoment = { date: string; weekday: string; time: string };

type StayCardProps = {
  checkIn: StayMoment;
  checkOut: StayMoment;
  address: string | null;
  bookingReference: string | null;
  color: string;
};

// A stay's card at the top of the event dialog, built like the boarding pass: check-in → check-out, the
// address as a map link, and the booking reference on a stub (to the right from `sm`, below on phones).
export const StayCard = ({ checkIn, checkOut, address, bookingReference, color }: StayCardProps): ReactElement => {
  const t = useTranslations('travel');

  return (
    <section aria-label={t('stay')} className='relative flex flex-col rounded-md border bg-card sm:flex-row'>
      <div className='flex min-w-0 flex-1 flex-col gap-4 p-4'>
        <span className='flex items-center gap-2'>
          <span style={{ color }}><TravelModeIcon travelMode='stay' className='h-4 w-4' /></span>
          <span className='font-mono text-sm font-medium tracking-wide'>{t('stay')}</span>
        </span>

        <div className='flex items-end gap-3'>
          <span className='flex min-w-0 flex-col gap-1.5'>
            <span className={CARD_LABEL}>{t('card.checkIn')}</span>
            <span className={cn(DAY, 'break-words')}>{checkIn.date}</span>
            <span className='font-mono text-sm tabular-nums text-muted-foreground'>{checkIn.weekday} · {checkIn.time}</span>
          </span>
          <span aria-hidden='true' style={{ borderTopColor: color }} className='mb-8 min-w-6 flex-1 border-t-2 border-dashed' />
          <span className='flex min-w-0 flex-col items-end gap-1.5 text-right'>
            <span className={CARD_LABEL}>{t('card.checkOut')}</span>
            <span className={cn(DAY, 'break-words')}>{checkOut.date}</span>
            <span className='font-mono text-sm tabular-nums text-muted-foreground'>{checkOut.weekday} · {checkOut.time}</span>
          </span>
        </div>

        {address && (
          <div className='border-t pt-3'>
            <AddressLink address={address} trackedFrom='stay_card' className='text-sm' />
          </div>
        )}
      </div>

      {bookingReference && (
        <div
          style={{ backgroundColor: getEventTint(color, 10) }}
          className='relative flex flex-col justify-end gap-4 rounded-b-md border-t-2 border-dashed p-4 sm:w-44 sm:shrink-0 sm:rounded-r-md sm:rounded-bl-none sm:border-t-0 sm:border-l-2'
        >
          {/* The perforation's notches, where the stub tears off */}
          <span aria-hidden='true' className='absolute -top-2 -left-2 hidden h-3.5 w-3.5 rounded-full border bg-background sm:block' />
          <span aria-hidden='true' className='absolute -bottom-2 -left-2 hidden h-3.5 w-3.5 rounded-full border bg-background sm:block' />
          <ReferenceStub reference={bookingReference} trackedFrom='stay_card' />
        </div>
      )}
    </section>
  );
};
