'use client';
import { useCopyToClipboard }           from '@/hooks/use-copy-to-clipboard';
import {
  getRouteLabel,
  getTravelChips,
  type TravelChip
}                                       from '@/lib/travel';
import type {
  TravelDetails,
  TravelMode
}                                       from '@/lib/types';
import { cn }                           from '@/lib/utils';
import {
  Plane,
  TrainFront
}                                       from 'lucide-react';
import { useTranslations }              from 'next-intl';
import type { ReactElement }            from 'react';

const CHIP = 'inline-flex items-center gap-1 rounded border bg-card px-1.5 py-0.5 font-mono text-[0.7rem] leading-none tabular-nums';

export const TravelModeIcon = ({ travelMode, className }: { travelMode: TravelMode; className?: string }): ReactElement =>
  travelMode === 'flight'
    ? <Plane aria-hidden='true' className={className} />
    : <TrainFront aria-hidden='true' className={className} />;

const ChipValue = ({ chip }: { chip: TravelChip }): ReactElement => {
  const t = useTranslations('travel.chips');
  // A flight number speaks for itself; every other value needs its label
  return chip.field === 'number'
    ? <>{chip.value}</>
    : <><span className='text-muted-foreground'>{t(chip.field)}</span>{chip.value}</>;
};

// Sits above the row's full-size open button (z-10), so tapping it copies instead of opening the event
const CopyReferenceChip = ({ chip }: { chip: TravelChip }): ReactElement => {
  const t = useTranslations('travel');
  const { isCopied, copy } = useCopyToClipboard();

  return (
    <button
      type='button'
      onClick={() => void copy(chip.value)}
      aria-label={t('copyReference', { reference: chip.value })}
      className={cn(
        CHIP,
        'relative z-10 cursor-pointer hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'pointer-coarse:py-1.5',
      )}
    >
      {isCopied ? <span aria-live='polite'>{t('copied')}</span> : <ChipValue chip={chip} />}
    </button>
  );
};

type TravelStripProps = {
  travelMode: TravelMode;
  travel: TravelDetails | null | undefined;
  className?: string;
};

export const TravelStrip = ({ travelMode, travel, className }: TravelStripProps): ReactElement => {
  const route = getRouteLabel(travel);
  const chips = getTravelChips(travelMode, travel);

  return (
    <span className={cn('flex flex-wrap items-center gap-1.5', className)} data-testid='travel-strip'>
      <span className='inline-flex items-center gap-1.5 font-mono text-xs font-medium'>
        <TravelModeIcon travelMode={travelMode} className='h-3.5 w-3.5 shrink-0' />
        {route}
      </span>
      {chips.map((chip) => (
        chip.field === 'booking_reference'
          ? <CopyReferenceChip key={chip.field} chip={chip} />
          : <span key={chip.field} className={CHIP}><ChipValue chip={chip} /></span>
      ))}
    </span>
  );
};
