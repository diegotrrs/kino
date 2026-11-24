'use client';
import { track }             from '@/lib/analytics/events';
import { cn }                from '@/lib/utils';
import { ArrowUpRight }      from 'lucide-react';
import { useTranslations }   from 'next-intl';
import type { ReactElement } from 'react';

type TrackFlightLinkProps = {
  url: string;
  number: string;
  // Coral on phones too when it's the stub's only button; next to "Copy reference" it's the outline one
  isOnlyAction: boolean;
};

// Opens the flight's live status on Flightradar24: full width on phones, coral in the stub from `sm`
export const TrackFlightLink = ({ url, number, isOnlyAction }: TrackFlightLinkProps): ReactElement => {
  const t = useTranslations('travel');

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      onClick={() => track('flight_tracked', { from: 'travel_card' })}
      aria-label={t('trackFlight', { number })}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isOnlyAction
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border bg-card hover:bg-secondary sm:border-0 sm:bg-primary sm:text-primary-foreground sm:hover:bg-primary/90',
        'sm:h-8 sm:text-xs',
      )}
    >
      {t('card.trackFlight')}
      <ArrowUpRight aria-hidden='true' className='h-3.5 w-3.5' />
    </a>
  );
};
