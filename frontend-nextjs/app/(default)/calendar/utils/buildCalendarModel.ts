import { DateTime } from "luxon"
import { CalendarDataModel } from "../types"

export const buildCalendarModel = (startDate: DateTime, endDate: DateTime): CalendarDataModel => {
  if(endDate < startDate) throw new Error('End date must be greater than start date')
  
  const dataModel: CalendarDataModel = []

  let currentDate = startDate;

  while (currentDate <= endDate) {
    dataModel.push({
      month: currentDate.month,
      dayOfMonth: currentDate.day,
      dayOfWeek: currentDate.weekday,
      year: currentDate.year
    })
    currentDate = currentDate.plus({ days: 1 });
  }

  return dataModel
}

