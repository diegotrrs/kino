'use client';
import { EventForm }          from '@/components/event-form';
import { EventsProvider }     from '@/context/events-context';
import { useEvents }          from '@/context/events-context';
import { formatDayHeading }   from '@/lib/day-names';
import {
  DEFAULT_EVENT_COLOR,
  getEventEdge,
  getEventTint
}                             from '@/lib/event-colors';
import type { Event }         from '@/lib/types';
import type { CalendarEvent } from '@/utils/data';
import {
  format,
  parse
}                             from 'date-fns';
import {
  LinkIcon,
  MapPinIcon,
  ReceiptIcon
}                             from 'lucide-react';
import { useTranslations }    from 'next-intl';
import { useRouter }          from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState
}                             from 'react';
import { EventDeleteButton }  from './event-delete-button';

export const groupByDate = (events: Event[]): [string, Event[]][] => {
  const sorted = [...events].sort((a, b) =>
    (a.date + a.start_time).localeCompare(b.date + b.start_time),
  );
  const map = new Map<string, Event[]>();
  for (const ev of sorted) {
    const bucket = map.get(ev.date);
    if (bucket) {
      bucket.push(ev);
    } else {
      map.set(ev.date, [ev]);
    }
  }
  return [...map.entries()];
};

const toCalendarEvent = (ev: Event): CalendarEvent => ({
  id:              String(ev.id),
  title:           ev.title,
  description:     ev.description ?? undefined,
  start:           new Date(`${ev.date}T${ev.start_time}`),
  end:             new Date(`${ev.end_date ?? ev.date}T${ev.end_time ?? ev.start_time}`),
  backgroundColor: ev.color,
  links:           ev.links,
  expenses:        ev.expenses,
});

type EventEditTriggerProps = {
  event:   Event;
  onClose: () => void;
};

const EventEditTrigger = ({ event, onClose }: EventEditTriggerProps) => {
  const { setEventEditOpen, eventEditOpen } = useEvents();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    setEventEditOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (eventEditOpen) {
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      onClose();
    }
  }, [eventEditOpen, onClose]);

  return <EventForm mode='edit' event={toCalendarEvent(event)} isDrag={false} />;
};

type EventTimelineClientProps = {
  events:             Event[];
  preferredCurrency:  string;
  // calendar id -> (yyyy-MM-dd -> day name)
  dayNamesByCalendar?: Record<number, Record<string, string>>;
};

export const EventTimelineClient = ({
  events,
  preferredCurrency,
  dayNamesByCalendar = {},
}: EventTimelineClientProps) => {
  const t      = useTranslations('events');
  const router = useRouter();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleClose = useCallback(() => {
    setSelectedEvent(null);
    router.refresh();
  }, [router]);

  if (events.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center'>
        <p className='font-display text-xl font-bold'>{t('empty')}</p>
        <p className='text-sm text-muted-foreground'>{t('emptyHint')}</p>
      </div>
    );
  }

  const groups = groupByDate(events);

  return (
    <>
      <div className='space-y-8'>
        {groups.map(([date, dayEvents]) => (
          <div key={date}>
            <div className='flex items-center gap-3 mb-3'>
              <span className='font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground'>
                {formatDayHeading(
                  format(parse(date, 'yyyy-MM-dd', new Date()), 'EEE d MMM yyyy'),
                  dayEvents.map((ev) => dayNamesByCalendar[ev.calendar_id]?.[date] ?? ''),
                )}
              </span>
              <div className='flex-1 border-t' />
            </div>
            <div className='space-y-2 pl-2'>
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className='flex rounded-md border transition-colors overflow-hidden hover:brightness-[0.98]'
                  style={{ backgroundColor: getEventTint(ev.color ?? DEFAULT_EVENT_COLOR, 10), borderColor: getEventEdge(ev.color ?? DEFAULT_EVENT_COLOR, 30) }}
                >
                  <button
                    type='button'
                    className='flex flex-1 min-w-0 gap-4 p-3 text-left'
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <div
                      className='-my-3 w-16 shrink-0 border-r border-dashed py-3 pr-3 text-right'
                      style={{ borderRightColor: getEventEdge(ev.color ?? DEFAULT_EVENT_COLOR) }}
                    >
                      <span className='text-sm font-mono font-medium tabular-nums'>
                        {format(parse(ev.start_time, 'HH:mm:ss', new Date()), 'HH:mm')}
                      </span>
                      {ev.end_time && (
                        <span className='block text-xs font-mono text-muted-foreground tabular-nums'>
                          {format(parse(ev.end_time, 'HH:mm:ss', new Date()), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-semibold text-sm leading-tight'>{ev.title}</p>
                      {ev.description && (
                        <p className='text-xs text-muted-foreground mt-0.5 line-clamp-1'>
                          {ev.description}
                        </p>
                      )}
                      <div className='flex flex-wrap gap-3 mt-1'>
                        {ev.location && (
                          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <MapPinIcon className='h-3 w-3' />
                            {ev.location}
                          </span>
                        )}
                        {ev.expenses.length > 0 && (
                          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <ReceiptIcon className='h-3 w-3' />
                            {t('expenseCount', { count: ev.expenses.length })}
                          </span>
                        )}
                        {ev.links.length > 0 && (
                          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <LinkIcon className='h-3 w-3' />
                            {t('linkCount', { count: ev.links.length })}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  {/* Separate div so clicks on the delete button don't open the dialog */}
                  <div className='shrink-0 p-3 pl-0'>
                    <EventDeleteButton eventId={ev.id} eventTitle={ev.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <EventsProvider
          calendarId={selectedEvent.calendar_id}
          calendarUuid={selectedEvent.calendar_uuid}
          preferredCurrency={preferredCurrency}
        >
          <EventEditTrigger event={selectedEvent} onClose={handleClose} />
        </EventsProvider>
      )}
    </>
  );
};
