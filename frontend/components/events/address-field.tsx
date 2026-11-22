'use client';
import { track }             from '@/lib/analytics/events';
import { getGoogleMapsUrl }  from '@/lib/maps';
import { cn }                from '@/lib/utils';
import { MapPin }            from 'lucide-react';
import { useTranslations }   from 'next-intl';
import {
  type ReactElement,
  useId
}                            from 'react';
import { AddressLink }       from './address-link';

const ADDRESS_MAX_LENGTH = 255;
const SECTION_LABEL = 'font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground';

type AddressFieldProps = {
  value: string;
  isReadOnly: boolean;
  onChange: (value: string) => void;
};

// Where the event happens. Visitors see it as a map link; an empty address shows nothing read-only.
export const AddressField = ({ value, isReadOnly, onChange }: AddressFieldProps): ReactElement | null => {
  const t = useTranslations('address');
  const inputId = useId();
  const address = value.trim();
  const url = getGoogleMapsUrl(address);

  if (isReadOnly) {
    return address === '' ? null : (
      <section className='grid gap-2'>
        <span className={SECTION_LABEL}>{t('label')}</span>
        <AddressLink address={address} trackedFrom='form' className='text-sm' />
      </section>
    );
  }

  return (
    <div className='grid gap-2'>
      <label htmlFor={inputId} className={SECTION_LABEL}>{t('label')}</label>
      <div className='flex gap-2'>
        <input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('placeholder')}
          maxLength={ADDRESS_MAX_LENGTH}
          autoComplete='off'
          className='h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        />
        {url && (
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            onClick={() => track('address_map_opened', { from: 'form' })}
            aria-label={t('openInMaps', { address })}
            title={t('openInMaps', { address })}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-card transition-colors hover:bg-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11 pointer-coarse:w-11',
            )}
          >
            <MapPin aria-hidden='true' className='h-4 w-4' />
          </a>
        )}
      </div>
    </div>
  );
};
