import { getTripSpan } from '@/lib/trip-span';
import { cn }          from '@/lib/utils';
import {
  getLocale,
  getTranslations
}                      from 'next-intl/server';

type TripPassProps = {
  startDate: string;
  eventDates: string[];
};

const getToday = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const TripPass = async ({ startDate, eventDates }: TripPassProps) => {
  const [t, locale] = await Promise.all([getTranslations('tripPass'), getLocale()]);
  const today = getToday();
  const span = getTripSpan(startDate, eventDates, today);

  const formatDay = (isoDate: string): string =>
    new Date(`${isoDate}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' }).toUpperCase();

  const daysUntil = Math.round((Date.parse(`${span.start}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);

  const getStatus = (): string => {
    if (span.currentDay !== null) {
      return t('dayOf', { current: span.currentDay, total: span.totalDays });
    }
    if (daysUntil > 0) {
      return t('departsIn', { count: daysUntil });
    }
    const daysSinceEnd = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${span.end}T00:00:00Z`)) / 86_400_000);
    return t('ended', { count: daysSinceEnd });
  };

  const dateRange = span.start === span.end ? formatDay(span.start) : `${formatDay(span.start)} → ${formatDay(span.end)}`;
  const isCurrent = span.currentDay !== null;

  return (
    <>
      <p className='w-full font-mono text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground lg:hidden' data-testid='trip-summary-line'>
        {dateRange} · {t('days', { count: span.totalDays })} ·{' '}
        <span className={cn((isCurrent || daysUntil > 0) && 'text-primary')}>{getStatus()}</span>
      </p>

      <div className='hidden w-fit max-w-full overflow-hidden rounded-md border bg-card lg:flex' data-testid='trip-pass'>
        <div className='grid gap-1.5 px-5 py-3'>
          <span className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>{t('dates')}</span>
          <span className='font-mono text-xl font-medium tabular-nums whitespace-nowrap'>{dateRange}</span>
        </div>
        <div className='relative grid gap-1.5 border-l-2 border-dashed px-5 py-3 before:absolute before:-top-2 before:-left-2 before:h-3.5 before:w-3.5 before:rounded-full before:border before:bg-background after:absolute after:-bottom-2 after:-left-2 after:h-3.5 after:w-3.5 after:rounded-full after:border after:bg-background'>
          <span className='font-mono text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground'>
            {t('days', { count: span.totalDays })}
          </span>
          <span className={cn('font-mono text-xl font-medium whitespace-nowrap', isCurrent && 'text-primary')}>
            {getStatus()}
          </span>
        </div>
      </div>
    </>
  );
};
