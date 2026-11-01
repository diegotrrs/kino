import { getTripSpan }         from '@/lib/trip-span';
import type { CalendarMember } from '@/lib/types';
import { cn }                  from '@/lib/utils';
import {
  getLocale,
  getTranslations
}                              from 'next-intl/server';

type TripPassProps = {
  startDate: string;
  eventDates: string[];
  members: Pick<CalendarMember, 'id' | 'name'>[];
};

const AVATAR_COLORS = ['bg-ev-terracotta', 'bg-ev-teal', 'bg-ev-ochre', 'bg-ev-sage', 'bg-ev-plum', 'bg-ev-slate'] as const;

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const getToday = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const TripPass = async ({ startDate, eventDates, members }: TripPassProps) => {
  const [t, locale] = await Promise.all([getTranslations('tripPass'), getLocale()]);
  const today = getToday();
  const span = getTripSpan(startDate, eventDates, today);

  const formatDay = (isoDate: string): string =>
    new Date(`${isoDate}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' }).toUpperCase();

  const getStatus = (): string => {
    if (span.currentDay !== null) {
      return t('dayOf', { current: span.currentDay, total: span.totalDays });
    }
    if (today < span.start) {
      const daysUntil = Math.round((Date.parse(`${span.start}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
      return t('departsIn', { count: daysUntil });
    }
    return t('complete');
  };

  return (
    <div className='flex w-full max-w-full overflow-hidden rounded-md border bg-card sm:w-fit' data-testid='trip-pass'>
      <div className='grid gap-1.5 px-4 py-3'>
        <span className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>{t('dates')}</span>
        <span className='font-mono text-base font-medium tabular-nums whitespace-nowrap'>
          {span.start === span.end ? formatDay(span.start) : `${formatDay(span.start)} → ${formatDay(span.end)}`}
        </span>
      </div>
      <div className='relative grid gap-1.5 border-l-2 border-dashed px-4 py-3 before:absolute before:-top-2 before:-left-2 before:h-3.5 before:w-3.5 before:rounded-full before:border before:bg-background after:absolute after:-bottom-2 after:-left-2 after:h-3.5 after:w-3.5 after:rounded-full after:border after:bg-background'>
        <span className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
          {t('days', { count: span.totalDays })}
        </span>
        <span className={cn('font-mono text-base font-medium whitespace-nowrap', span.currentDay !== null && 'text-primary')}>
          {getStatus()}
        </span>
      </div>
      {members.length > 0 && (
        <div className='hidden gap-1.5 border-l px-4 py-3 sm:grid'>
          <span className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
            {t('travellers', { count: members.length })}
          </span>
          <div className='flex -space-x-1.5'>
            {members.slice(0, 5).map((member, index) => (
              <span
                key={member.id}
                title={member.name}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[0.6rem] font-semibold text-background',
                  AVATAR_COLORS[index % AVATAR_COLORS.length],
                )}
              >
                {getInitials(member.name)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
