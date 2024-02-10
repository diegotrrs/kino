import { DayNames, MonthNames } from "@/app/(default)/calendar/types";
import { Language, TranslationKey, getTranslations } from ".";

export const getMonthsTranslated = (language?: Language): string[] =>
  getTranslations(
    [
      TranslationKey.Calendar_Months_January,
      TranslationKey.Calendar_Months_February,
      TranslationKey.Calendar_Months_March,
      TranslationKey.Calendar_Months_April,
      TranslationKey.Calendar_Months_May,
      TranslationKey.Calendar_Months_June,
      TranslationKey.Calendar_Months_July,
      TranslationKey.Calendar_Months_August,
      TranslationKey.Calendar_Months_September,
      TranslationKey.Calendar_Months_October,
      TranslationKey.Calendar_Months_November,
      TranslationKey.Calendar_Months_December,
    ],
    language
  );

  export const getDaysTranslated = (language?: Language): string[] =>
  getTranslations(
    [
      TranslationKey.Calendar_Days_Monday,
      TranslationKey.Calendar_Days_Tuesday,
      TranslationKey.Calendar_Days_Wednesday,
      TranslationKey.Calendar_Days_Thursday,
      TranslationKey.Calendar_Days_Friday,
      TranslationKey.Calendar_Days_Saturday,
      TranslationKey.Calendar_Days_Sunday,
    ],
    language
  );


  export const getMonthNames = (lang?: Language) => {
    const monthTranslations = getMonthsTranslated(lang)
    const monthNames = monthTranslations.reduce<MonthNames>((acc, currentTranslation, currentIndex) => {
      const monthId = currentIndex + 1
      acc[monthId] = currentTranslation // This is tightly coupled to the order of the months in the translation file and to the ids in calendar/types.tsx
      return acc
    }, {})
    return monthNames
  }

  export const getDayNames = (lang?: Language) => {
    const dayNamesTranslations = getDaysTranslated(lang)
    const dayNames = dayNamesTranslations.reduce<DayNames>((acc, currentTranslation, currentIndex) => {
      const dayId = currentIndex + 1
      acc[dayId] = currentTranslation // This is tightly coupled to the order of the months in the translation file and to the ids in calendar/types.tsx
      return acc
    }, {})
    return dayNames
  }
