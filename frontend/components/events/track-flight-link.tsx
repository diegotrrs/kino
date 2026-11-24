'use client';
import { track }             from '@/lib/analytics/events';
import { cn }                from '@/lib/utils';
import { ArrowUpRight }      from 'lucide-react';
import { useTranslations }   from 'next-intl';
import type { ReactElement } from 'react';

type TrackFlightLinkProps = {
  url: string;
  number: string;
};

// Opens the flight's live status on Flightradar24: a full-width outline button on phones, coral in the stub from `sm`
export const TrackFlightLink = ({ url, number }: TrackFlightLinkProps): ReactElement => {
  const t = useTranslations('travel');

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      onClick={() => track('flight_tracked', { from: 'travel_card' })}
      aria-label={t('trackFlight', { number })}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md border bg-card px-3 text-sm font-semibold transition-colors hover:bg-secondary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'sm:h-8 sm:border-0 sm:bg-primary sm:text-xs sm:text-primary-foreground sm:hover:bg-primary/90',
      )}
    >
      {t('card.trackFlight')}
      <ArrowUpRight aria-hidden='true' className='h-3.5 w-3.5' />
    </a>
  );
};
