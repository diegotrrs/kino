import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { getDateFnsLocale, getMonthNames } from './date-locale';

describe('getDateFnsLocale', () => {
  it('should format dates in the app\'s language', () => {
    const date = new Date(2035, 5, 4);

    expect(format(date, 'EEE d MMM', { locale: getDateFnsLocale('es') })).toBe('lun 4 jun');
    expect(format(date, 'EEE d MMM', { locale: getDateFnsLocale('de') })).toBe('Mo. 4 Juni');
    expect(format(date, 'EEE d MMM', { locale: getDateFnsLocale('en') })).toBe('Mon 4 Jun');
  });

  it('should fall back to English for an unknown locale', () => {
    expect(format(new Date(2035, 5, 4), 'MMMM', { locale: getDateFnsLocale('xx') })).toBe('June');
  });
});

describe('getMonthNames', () => {
  it('should give the twelve months in order, capitalised, in the app\'s language', () => {
    const months = getMonthNames('es');

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ value: '1', label: 'Enero' });
    expect(months[6]).toEqual({ value: '7', label: 'Julio' });
  });

  it('should keep English month names for English', () => {
    expect(getMonthNames('en')[6].label).toBe('July');
  });
});
