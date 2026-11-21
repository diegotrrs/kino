'use client';
import { useCopyToClipboard }          from '@/hooks/use-copy-to-clipboard';
import { BOOKING_REFERENCE_MAX_LENGTH } from '@/lib/travel';
import { cn }                          from '@/lib/utils';
import { useTranslations }             from 'next-intl';
import {
  type ReactElement,
  useId
}                                      from 'react';

type BookingReferenceFieldProps = {
  value: string;
  isReadOnly: boolean;
  onChange: (value: string) => void;
};

// Any event can have a booking reference (a museum ticket, a table, a flight). Visitors never get one from
// the API, so a read-only form with no reference shows nothing.
export const BookingReferenceField = ({ value, isReadOnly, onChange }: BookingReferenceFieldProps): ReactElement | null => {
  const t = useTranslations('travel');
  const { isCopied, copy } = useCopyToClipboard();
  const inputId = useId();
  const reference = value.trim();

  if (isReadOnly && reference === '') {
    return null;
  }

  return (
    <div className='grid gap-1.5'>
      <label htmlFor={inputId} className='text-xs text-muted-foreground'>{t('fields.booking_reference')}</label>
      <div className='flex gap-2'>
        <input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('booking_referencePlaceholder')}
          maxLength={BOOKING_REFERENCE_MAX_LENGTH}
          readOnly={isReadOnly}
          autoComplete='off'
          className={cn(
            'h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isReadOnly && 'cursor-default',
          )}
        />
        {reference !== '' && (
          <button
            type='button'
            onClick={() => void copy(reference)}
            aria-label={t('copyReference', { reference })}
            className='h-10 shrink-0 rounded-md border bg-card px-3 text-xs font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11'
          >
            <span aria-live='polite'>{isCopied ? t('copied') : t('card.copy')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
