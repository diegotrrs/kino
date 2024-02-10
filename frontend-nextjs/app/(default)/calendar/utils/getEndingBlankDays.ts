import { DateTime } from "luxon";
import { CalendarDataModel } from "../types"


export const getEndingBlankDays = (calendarModel: CalendarDataModel): number[] => {
  const firstDay = calendarModel[0]
  const firstDayDate = DateTime.local(firstDay.year, firstDay.month);

  const endingDayOfWeek: number = firstDayDate.endOf('month').weekday; // eg: 4
  // day that the month ends on
  const endingBlankDaysCount = 7 - endingDayOfWeek
  const endingBlankDaysArray = Array.from({length: endingBlankDaysCount }).map((_, index) => index + 1)

  return endingBlankDaysArray
}
