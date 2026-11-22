'use client';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn }                 from '@/lib/utils';
import { useTranslations }    from 'next-intl';
import type { ReactElement }  from 'react';

export const CARD_LABEL = 'font-mono text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground';

// The booking reference on a card's tear-off stub, with a full-width Copy button on phones
export const ReferenceStub = ({ reference }: { reference: string }): ReactElement => {
  const t = useTranslations('travel');
  const { isCopied, copy } = useCopyToClipboard();

  return (
    <div className='flex flex-col gap-2'>
      <span className={CARD_LABEL}>{t('fields.booking_reference')}</span>
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
  );
};
