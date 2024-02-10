import { CalendarDataModel } from "../types"

export const getStartingBlankDays = (calendarModel: CalendarDataModel): number[] => {
  const firstDay = calendarModel[0]
  const startingBlankDays = Array.from({length: firstDay.dayOfWeek - 1 }).map((_, index) => index + 1)
  return startingBlankDays
}
