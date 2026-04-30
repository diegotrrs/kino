import {
  clsx,
  type ClassValue
}                  from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
export const getDateFromMinutes = (minutes: number) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set time to midnight
  now.setMinutes(minutes);
  return now;
};
