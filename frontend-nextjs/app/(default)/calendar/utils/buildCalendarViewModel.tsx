import { CalendarDataModel, CalendarViewModel, DayNames, MonthNames } from "../types"
import { getDayNames, getDaysTranslated, getMonthNames, getMonthsTranslated } from "@/lib/i18n/util"
import { Language } from "@/lib/i18n"
import { getStartingBlankDays } from "./getStartingBlankDays"
import { getEndingBlankDays } from "./getEndingBlankDays"


export const buildCalendarViewModel = (calendarDataModel: CalendarDataModel, lang?: Language): CalendarViewModel => {
  // TODO: The order in which the months are returned will be the order in which they are displayed in the calendar. This introduces coupling between the model and the view.
 
  const monthNames = getMonthNames(lang);
  const dayNames = getDayNames(lang);

  // const monthTranslations = getMonthsTranslated(lang)
  // const dayNamesTranslations = getDaysTranslated(lang)

  // const monthNames = monthTranslations.reduce<MonthNames>((acc, currentMonth, currentIndex) => {
  //   acc[currentIndex+1] = currentMonth
  //   return acc
  // }, {})

  // const dayNames = dayNamesTranslations.reduce<DayNames>((acc, currentDay, currentIndex) => {
  //   acc[currentIndex+1] = currentDay
  //   return acc
  // }, {})

  const startingBlankDays = getStartingBlankDays(calendarDataModel)
  const endingBlankDays = getEndingBlankDays(calendarDataModel)

  return  {
    data: calendarDataModel,
    startingBlankDaysIds: startingBlankDays,
    endingBlankDaysIds: endingBlankDays,
    globalData: {
      monthNames,
      dayNames,
    }
  }
}
