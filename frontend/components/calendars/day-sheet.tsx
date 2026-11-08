'use client';
import {
  removeDayName,
  setDayName
}                             from '@/app/(app)/calendars/actions';
import { Button }             from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
}                             from '@/components/ui/dialog';
import { useEvents }          from '@/context/events-context';
import { useToast }           from '@/hooks/use-toast';
import { getEventsOnDay }     from '@/lib/day-events';
import {
  MAX_DAY_NAME_LENGTH,
  toDateKey
}                             from '@/lib/day-names';
import {
  DEFAULT_EVENT_COLOR,
  getEventEdge,
  getEventTint
}                             from '@/lib/event-colors';
import type { CalendarEvent } from '@/utils/data';
import {
  useLocale,
  useTranslations
}                             from 'next-intl';
import {
  useEffect,
  useRef,
  useState
}                             from 'react';

type DaySheetProps = {
  day: Date | null;
  events: CalendarEvent[];
  readOnly: boolean;
  onClose: () => void;
  onAddEvent: (day: Date) => void;
  onOpenEvent: (event: CalendarEvent) => void;
};

const SAVE_DELAY_MS = 600;

type DayNameFieldProps = {
  dateKey: string;
  readOnly: boolean;
};

// Saves while typing (debounced) and when the sheet closes; the calendar cell updates as you type
const DayNameField = ({ dateKey, readOnly }: DayNameFieldProps) => {
  const { calendarUuid, dayNames, setDayNameLocal } = useEvents();
  const { toast } = useToast();
  const t = useTranslations('dayNames');
  const [draft, setDraft] = useState(dayNames[dateKey] ?? '');
  const savedRef = useRef(dayNames[dateKey] ?? '');
  const pendingRef = useRef<string | null>(null);

  const flush = async () => {
    const value = pendingRef.current;
    pendingRef.current = null;
    if (value === null || !calendarUuid) return;

    const name = value.trim();
    if (name === savedRef.current) return;
    const previous = savedRef.current;
    savedRef.current = name;
    try {
      if (name) {
        await setDayName(calendarUuid, dateKey, name);
      } else {
        await removeDayName(calendarUuid, dateKey);
      }
    } catch {
      savedRef.current = previous;
      setDayNameLocal(dateKey, previous || null);
      toast({ variant: 'destructive', title: t('saveFailed') });
    }
  };
  // Effects below call the latest flush without re-running when the context re-renders this field
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  useEffect(() => {
    if (pendingRef.current === null) return;
    const timer = setTimeout(() => flushRef.current(), SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft]);

  // Closing the sheet unmounts the field: save whatever was typed last
  useEffect(() => () => { flushRef.current(); }, []);

  if (readOnly) {
    return dayNames[dateKey] ? (
      <p className='px-5 pb-3 font-display text-lg font-bold text-teal'>{dayNames[dateKey]}</p>
    ) : null;
  }

  return (
    <div className='px-5 pb-4'>
      <label htmlFor={`day-sheet-name-${dateKey}`} className='sr-only'>{t('nameThisDay')}</label>
      <input
        id={`day-sheet-name-${dateKey}`}
        value={draft}
        maxLength={MAX_DAY_NAME_LENGTH}
        placeholder={t('placeholder')}
        onChange={(e) => {
          setDraft(e.target.value);
          pendingRef.current = e.target.value;
          setDayNameLocal(dateKey, e.target.value.trim() || null);
        }}
        className='w-full border-0 border-b-2 border-dashed bg-transparent pb-2 font-display text-lg font-bold text-teal outline-none placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground focus:border-teal'
      />
    </div>
  );
};

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// Phones: tapping a day opens this sheet, so busy days never leave a tiny target for adding or picking an event
export const DaySheet = ({ day, events, readOnly, onClose, onAddEvent, onOpenEvent }: DaySheetProps) => {
  const t = useTranslations('daySheet');
  const locale = useLocale();
  const dayEvents = day ? getEventsOnDay(events, day) : [];

  return (
    <Dialog open={day !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        // Don't focus the name field on open: on phones that would pop the keyboard over the sheet
        onOpenAutoFocus={(e) => e.preventDefault()}
        className='top-auto bottom-0 max-h-[85svh] max-w-none translate-y-0 gap-0 overflow-y-auto rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 sm:rounded-b-none'>
        <span aria-hidden='true' className='mx-auto mt-2.5 h-1 w-10 rounded-full bg-border' />
        <div className='flex items-baseline justify-between gap-3 px-5 pt-4 pb-3 pr-12'>
          <DialogTitle className='font-display text-2xl font-extrabold tracking-tight'>
            {day?.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
          </DialogTitle>
          <DialogDescription className='shrink-0 font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
            {t('count', { count: dayEvents.length })}
          </DialogDescription>
        </div>

        {day && <DayNameField key={toDateKey(day)} dateKey={toDateKey(day)} readOnly={readOnly} />}

        <div className='grid gap-2 px-4'>
          {dayEvents.length === 0 && (
            <p className='rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground'>{t('empty')}</p>
          )}
          {dayEvents.map((event) => {
            const color = event.backgroundColor ?? DEFAULT_EVENT_COLOR;
            return (
              <button
                key={event.id}
                type='button'
                onClick={() => onOpenEvent(event)}
                style={{ backgroundColor: getEventTint(color, 12), borderColor: getEventEdge(color, 35) }}
                className='flex min-h-12 overflow-hidden rounded-md border text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <span
                  style={{ borderRightColor: getEventEdge(color) }}
                  className='flex w-18 shrink-0 items-center justify-end border-r-2 border-dashed px-3 font-mono text-sm font-medium tabular-nums'
                >
                  {formatTime(new Date(event.start))}
                </span>
                <span className='flex min-w-0 items-center px-3 py-2 text-sm font-semibold'>
                  <span className='truncate'>{event.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className='px-4 pt-4 pb-6'>
          {!readOnly && day && (
            <Button className='h-11 w-full' onClick={() => onAddEvent(day)}>
              {t('add', { day: day.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }) })}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
