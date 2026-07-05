import { EventDeleteButton } from './event-delete-button';
import type { Event }         from '@/lib/types';
import { format, parse }      from 'date-fns';
import {
  LinkIcon,
  MapPinIcon,
  ReceiptIcon,
}                             from 'lucide-react';
import { getTranslations }    from 'next-intl/server';

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

type EventListProps = {
  events: Event[];
};

export const EventList = async ({ events }: EventListProps) => {
  const t = await getTranslations('events');

  if (events.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center'>
        <p className='text-lg font-medium'>{t('empty')}</p>
        <p className='text-sm text-muted-foreground'>{t('emptyHint')}</p>
      </div>
    );
  }

  const groups = groupByDate(events);

  return (
    <div className='space-y-8'>
      {groups.map(([date, dayEvents]) => (
        <div key={date}>
          <div className='flex items-center gap-3 mb-3'>
            <span className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
              {format(parse(date, 'yyyy-MM-dd', new Date()), 'EEE d MMM yyyy')}
            </span>
            <div className='flex-1 border-t' />
          </div>
          <div className='space-y-2 pl-2'>
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                className='flex gap-4 rounded-lg p-3 bg-card border hover:bg-accent/30 transition-colors'
                style={{ borderLeftWidth: 4, borderLeftColor: ev.color ?? '#AEC6E4' }}
              >
                <div className='w-20 shrink-0 text-right'>
                  <span className='text-xs font-mono text-muted-foreground'>
                    {format(parse(ev.start_time, 'HH:mm:ss', new Date()), 'HH:mm')}
                  </span>
                  {ev.end_time && (
                    <span className='block text-xs font-mono text-muted-foreground/60'>
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
                <div className='shrink-0'>
                  <EventDeleteButton eventId={ev.id} eventTitle={ev.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
