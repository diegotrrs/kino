import { type Locale, de, enGB, es, pt } from 'date-fns/locale';

// The app's locales (i18n/routing.ts) mapped to date-fns's; English uses en-GB, the app's existing date style
const DATE_FNS_LOCALES: Record<string, Locale> = { en: enGB, es, pt, de };

export const getDateFnsLocale = (locale: string): Locale => DATE_FNS_LOCALES[locale] ?? enGB;

const capitalise = (text: string): string => text.charAt(0).toLocaleUpperCase() + text.slice(1);

export const getMonthNames = (locale: string): { value: string; label: string }[] =>
  Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: capitalise(new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2021, index, 15))),
  }));
