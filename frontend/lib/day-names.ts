import type { DayName } from '@/lib/types';

export const MAX_DAY_NAME_LENGTH = 60;

// Local date as yyyy-MM-dd, the key day names are stored under
export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const toDayNameMap = (dayNames: DayName[]): Record<string, string> =>
  Object.fromEntries(dayNames.map(({ date, name }) => [date.slice(0, 10), name]));

// Unnamed days inside the trip invite a name; days outside it stay clean
export const shouldShowNameMarker = (
  dateKey: string,
  names: Record<string, string>,
  trip: { start: string; end: string },
): boolean => !names[dateKey] && dateKey >= trip.start && dateKey <= trip.end;

// Events page date divider, e.g. "Sat 7 Nov · Visit to Vatican"
export const formatDayHeading = (dateLabel: string, names: string[]): string => {
  const unique = [...new Set(names.filter(Boolean))];
  return unique.length ? `${dateLabel} · ${unique.join(' / ')}` : dateLabel;
};
