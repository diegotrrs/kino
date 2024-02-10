

export enum Language {
  English = 'en',
  Spanish = 'es',
}

export const { English, Spanish } = Language

export enum TranslationKey {
  /** Months **/
  Calendar_Months_January = 'Calendar.Months.January',
  Calendar_Months_February = 'Calendar.Months.February',
  Calendar_Months_March = 'Calendar.Months.March',
  Calendar_Months_April = 'Calendar.Months.April',
  Calendar_Months_May = 'Calendar.Months.May',
  Calendar_Months_June = 'Calendar.Months.June',
  Calendar_Months_July = 'Calendar.Months.July',
  Calendar_Months_August = 'Calendar.Months.August',
  Calendar_Months_September = 'Calendar.Months.September',
  Calendar_Months_October = 'Calendar.Months.October',
  Calendar_Months_November = 'Calendar.Months.November',
  Calendar_Months_December = 'Calendar.Months.December',
  /** Days */
  Calendar_Days_Monday = 'Calendar.Days.Monday',
  Calendar_Days_Tuesday = 'Calendar.Days.Tuesday',
  Calendar_Days_Wednesday = 'Calendar.Days.Wednesday',
  Calendar_Days_Thursday = 'Calendar.Days.Thursday',
  Calendar_Days_Friday = 'Calendar.Days.Friday',
  Calendar_Days_Saturday = 'Calendar.Days.Saturday',
  Calendar_Days_Sunday = 'Calendar.Days.Sunday'
}

export type Translations = Record<Language, Record<TranslationKey, string>>

const translations: Translations = {
  [Language.English]: {
    [TranslationKey.Calendar_Months_January]: 'January',
    [TranslationKey.Calendar_Months_February]: 'February',
    [TranslationKey.Calendar_Months_March]: 'March',
    [TranslationKey.Calendar_Months_April]: 'April',
    [TranslationKey.Calendar_Months_May]: 'May',
    [TranslationKey.Calendar_Months_June]: 'June',
    [TranslationKey.Calendar_Months_July]: 'July',
    [TranslationKey.Calendar_Months_August]: 'August',
    [TranslationKey.Calendar_Months_September]: 'September',
    [TranslationKey.Calendar_Months_October]: 'October',
    [TranslationKey.Calendar_Months_November]: 'November',
    [TranslationKey.Calendar_Months_December]: 'December',
    [TranslationKey.Calendar_Days_Monday]: 'Monday',
    [TranslationKey.Calendar_Days_Tuesday]: 'Tuesday',
    [TranslationKey.Calendar_Days_Wednesday]: 'Wednesday',
    [TranslationKey.Calendar_Days_Thursday]: 'Thursday',
    [TranslationKey.Calendar_Days_Friday]: 'Friday',
    [TranslationKey.Calendar_Days_Saturday]: 'Saturday',
    [TranslationKey.Calendar_Days_Sunday]: 'Sunday'
  },
  [Language.Spanish]: {
    [TranslationKey.Calendar_Months_January]: 'Enero',
    [TranslationKey.Calendar_Months_February]: 'Febrero',
    [TranslationKey.Calendar_Months_March]: 'Marzo',
    [TranslationKey.Calendar_Months_April]: 'Abril',
    [TranslationKey.Calendar_Months_May]: 'Mayo',
    [TranslationKey.Calendar_Months_June]: 'Junio',
    [TranslationKey.Calendar_Months_July]: 'Julio',
    [TranslationKey.Calendar_Months_August]: 'Agosto',
    [TranslationKey.Calendar_Months_September]: 'Septiembre',
    [TranslationKey.Calendar_Months_October]: 'Octubre',
    [TranslationKey.Calendar_Months_November]: 'Noviembre',
    [TranslationKey.Calendar_Months_December]: 'Diciembre',
    [TranslationKey.Calendar_Days_Monday]: 'Lunes',
    [TranslationKey.Calendar_Days_Tuesday]: 'Martes',
    [TranslationKey.Calendar_Days_Wednesday]: 'Miércoles',
    [TranslationKey.Calendar_Days_Thursday]: 'Jueves',
    [TranslationKey.Calendar_Days_Friday]: 'Viernes',
    [ TranslationKey.Calendar_Days_Saturday]: 'Sábado',
    [TranslationKey.Calendar_Days_Sunday]: 'Domingo'
  }
}


export const getTranslatedText = (key: TranslationKey, lang: Language = English): string => translations[lang][key]

export const getTranslations = (keys: TranslationKey[], lang: Language = English) => keys.map(key => translations[lang][key])