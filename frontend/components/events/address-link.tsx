'use client';
import { type AnalyticsEvents, track } from '@/lib/analytics/events';
import { getGoogleMapsUrl } from '@/lib/maps';
import { cn }               from '@/lib/utils';
import { MapPin }           from 'lucide-react';
import { useTranslations }  from 'next-intl';
import type { ReactElement } from 'react';

type AddressLinkProps = {
  address: string | null | undefined;
  // Where it's shown, for analytics
  trackedFrom: AnalyticsEvents['address_map_opened']['from'];
  className?: string;
};

// The address as a Google Maps link. In a row it sits above the full-size open button (z-10), like the
// REF chip, so tapping it opens the map rather than the event.
export const AddressLink = ({ address, trackedFrom, className }: AddressLinkProps): ReactElement | null => {
  const t = useTranslations('address');
  const url = getGoogleMapsUrl(address);

  if (!url || !address) {
    return null;
  }

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      onClick={() => track('address_map_opened', { from: trackedFrom })}
      aria-label={t('openInMaps', { address: address.trim() })}
      className={cn(
        'relative z-10 inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline',
        'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <MapPin aria-hidden='true' className='h-3 w-3 shrink-0' />
      <span className='truncate'>{address.trim()}</span>
    </a>
  );
};
