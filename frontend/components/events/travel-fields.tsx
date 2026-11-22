'use client';
import type { TravelField, TravelMode } from '@/lib/types';
import {
  FIELDS_BY_TRAVEL_MODE,
  TRAVEL_FIELD_MAX_LENGTH,
  type TravelFormValues
}                                       from '@/lib/travel';
import { cn }                           from '@/lib/utils';
import {
  BedDouble,
  Plane,
  TrainFront
}                                       from 'lucide-react';
import { TravelModeIcon }               from './travel-strip';
import { useTranslations }              from 'next-intl';
import {
  type ReactElement,
  useId
}                                       from 'react';

const SECTION_LABEL = 'font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground';

const MODE_OPTIONS = [
  { mode: null, labelKey: 'none', Icon: null },
  { mode: 'flight', labelKey: 'flight', Icon: Plane },
  { mode: 'train', labelKey: 'train', Icon: TrainFront },
  { mode: 'stay', labelKey: 'stay', Icon: BedDouble },
] as const;

// Route fields take the full width; the short ticket fields share rows
const WIDE_FIELDS: ReadonlySet<TravelField> = new Set(['origin', 'destination']);

type TravelFieldsProps = {
  travelMode: TravelMode | null;
  values: TravelFormValues;
  isReadOnly: boolean;
  onTravelModeChange: (travelMode: TravelMode | null) => void;
  onValueChange: (field: TravelField, value: string) => void;
};

export const TravelFields = ({
  travelMode,
  values,
  isReadOnly,
  onTravelModeChange,
  onValueChange,
}: TravelFieldsProps): ReactElement | null => {
  const t = useTranslations('travel');
  const id = useId();

  // Visitors only see a travel section when the event is a flight or a train
  if (isReadOnly && travelMode === null) {
    return null;
  }

  const getPlaceholder = (field: TravelField): string | undefined => {
    if (field === 'origin' || field === 'destination') {
      return t(`${field}Placeholder.${travelMode === 'train' ? 'train' : 'flight'}`);
    }
    if (field === 'number') {
      return t(`${field}Placeholder`);
    }
    return undefined;
  };

  // Empty fields say nothing when read-only
  const visibleFields = travelMode === null
    ? []
    : FIELDS_BY_TRAVEL_MODE[travelMode].filter((field) => !isReadOnly || values[field] !== '');

  return (
    <fieldset className='grid gap-3'>
      <legend className={cn(SECTION_LABEL, 'mb-2')}>{t('label')}</legend>

      {!isReadOnly && (
        <div className='inline-flex w-fit rounded-md border bg-card p-0.5'>
          {MODE_OPTIONS.map(({ mode, labelKey, Icon }) => (
            <label
              key={labelKey}
              className={cn(
                'flex h-9 cursor-pointer items-center gap-1.5 rounded px-3 text-sm text-muted-foreground transition-colors pointer-coarse:h-11',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                travelMode === mode && 'bg-secondary font-medium text-foreground',
              )}
            >
              <input
                type='radio'
                name={`travel-mode-${id}`}
                className='sr-only'
                checked={travelMode === mode}
                onChange={() => onTravelModeChange(mode)}
              />
              {/* Four modes with their icons don't fit a phone in every language (Portuguese), so phones get words only */}
              {Icon && <Icon aria-hidden='true' className='hidden h-4 w-4 sm:block' />}
              {t(labelKey)}
            </label>
          ))}
        </div>
      )}

      {isReadOnly && travelMode !== null && (
        <span className='flex items-center gap-1.5 text-sm font-medium'>
          <TravelModeIcon travelMode={travelMode} className='h-4 w-4' />
          {t(travelMode)}
        </span>
      )}

      {visibleFields.length > 0 && (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {visibleFields.map((field) => (
            <label
              key={field}
              className={cn('grid gap-1.5', WIDE_FIELDS.has(field) ? 'col-span-2' : 'col-span-1')}
            >
              <span className='text-xs text-muted-foreground'>{t(`fields.${field}`)}</span>
              <input
                value={values[field]}
                onChange={(event) => onValueChange(field, event.target.value)}
                placeholder={getPlaceholder(field)}
                maxLength={TRAVEL_FIELD_MAX_LENGTH[field]}
                readOnly={isReadOnly}
                autoComplete='off'
                className={cn(
                  'h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  field !== 'origin' && field !== 'destination' && 'font-mono',
                  isReadOnly && 'cursor-default',
                )}
              />
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
};
