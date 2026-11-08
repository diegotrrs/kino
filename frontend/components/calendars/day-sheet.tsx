'use client';
import { Button }             from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
}                             from '@/components/ui/dialog';
import { getEventsOnDay }     from '@/lib/day-events';
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

type DaySheetProps = {
  day: Date | null;
  events: CalendarEvent[];
  readOnly: boolean;
  onClose: () => void;
  onAddEvent: (day: Date) => void;
  onOpenEvent: (event: CalendarEvent) => void;
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
      <DialogContent className='top-auto bottom-0 max-h-[85svh] max-w-none translate-y-0 gap-0 overflow-y-auto rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 sm:rounded-b-none'>
        <span aria-hidden='true' className='mx-auto mt-2.5 h-1 w-10 rounded-full bg-border' />
        <div className='flex items-baseline justify-between gap-3 px-5 pt-4 pb-3 pr-12'>
          <DialogTitle className='font-display text-2xl font-extrabold tracking-tight'>
            {day?.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}
          </DialogTitle>
          <DialogDescription className='shrink-0 font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
            {t('count', { count: dayEvents.length })}
          </DialogDescription>
        </div>

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
