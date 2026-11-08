'use client';
import {
  removeDayName,
  setDayName
}                              from '@/app/(app)/calendars/actions';
import { Button }              from '@/components/ui/button';
import { Input }               from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
}                              from '@/components/ui/popover';
import { useEvents }           from '@/context/events-context';
import { useToast }            from '@/hooks/use-toast';
import { MAX_DAY_NAME_LENGTH } from '@/lib/day-names';
import {
  useLocale,
  useTranslations
}                              from 'next-intl';
import { useState }            from 'react';

type DayNamePopoverProps = {
  dateKey: string;
  children: React.ReactNode;
};

// Larger screens: click a day's name (or "+ Name this day") to name it in place
export const DayNamePopover = ({ dateKey, children }: DayNamePopoverProps) => {
  const { calendarUuid, dayNames, setDayNameLocal } = useEvents();
  const { toast } = useToast();
  const t = useTranslations('dayNames');
  const locale = useLocale();
  const current = dayNames[dateKey] ?? '';
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(current);

  const dateLabel = new Date(`${dateKey}T12:00:00`)
    .toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase();

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(current);
    setOpen(next);
  };

  const save = async (value: string) => {
    if (!calendarUuid) return;
    const name = value.trim();
    setOpen(false);
    if (name === current) return;

    setDayNameLocal(dateKey, name || null);
    try {
      if (name) {
        await setDayName(calendarUuid, dateKey, name);
      } else {
        await removeDayName(calendarUuid, dateKey);
      }
    } catch {
      setDayNameLocal(dateKey, current || null);
      toast({ variant: 'destructive', title: t('saveFailed') });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align='start' className='w-72 space-y-3 p-3' onMouseDown={(e) => e.stopPropagation()}>
        <label htmlFor={`day-name-${dateKey}`} className='block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
          {t('nameThisDay')} · {dateLabel}
        </label>
        <Input
          id={`day-name-${dateKey}`}
          value={draft}
          maxLength={MAX_DAY_NAME_LENGTH}
          placeholder={t('placeholder')}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              save(draft);
            }
          }}
        />
        <div className='flex items-center justify-between'>
          {current ? (
            <Button type='button' variant='ghost' size='sm' className='px-1 text-muted-foreground' onClick={() => save('')}>
              {t('removeName')}
            </Button>
          ) : <span />}
          <Button type='button' size='sm' onClick={() => save(draft)}>
            {t('save')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
