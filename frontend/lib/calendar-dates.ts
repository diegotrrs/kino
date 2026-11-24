import { format } from 'date-fns';

const toDayKey = (date: Date): string => format(date, 'yyyy-MM-dd');

// A calendar without a start date starts today, so its end date can't be before today
export const isEndBeforeStart = (
  startDate: Date | undefined,
  endDate: Date | undefined,
  today: Date,
): boolean => {
  if (!endDate) {
    return false;
  }
  return toDayKey(endDate) < toDayKey(startDate ?? today);
};
