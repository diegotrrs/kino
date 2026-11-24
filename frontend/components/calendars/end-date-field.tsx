'use client';
import { DateTimePicker }  from '@/components/date-picker';
import { Button }          from '@/components/ui/button';
import { X }               from 'lucide-react';
import { useTranslations } from 'next-intl';

type EndDateFieldProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  startDate?: Date;
};

// Optional trip end date: opens on the start month, can't go before the start, and can be cleared
export const EndDateField = ({ value, onChange, startDate }: EndDateFieldProps) => {
  const t = useTranslations('createCalendar');
  const earliest = startDate ?? new Date();

  return (
    <div className='flex items-center gap-2'>
      <DateTimePicker
        value={value}
        onChange={onChange}
        granularity='day'
        displayFormat={{ hour24: 'PP', hour12: 'PP' }}
        placeholder={t('endDatePlaceholder')}
        minDate={earliest}
        defaultMonth={earliest}
      />
      {value && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={t('clearEndDate')}
          onClick={() => onChange(undefined)}
        >
          <X className='h-4 w-4' />
        </Button>
      )}
    </div>
  );
};
