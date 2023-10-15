'use client'

import { CalendarProperties } from './calendar-properties'

export default function CalendarTitle() {

  const {
    name,
    startDate,
    endDate,
    monthNames,
    currentMonth,
    currentYear,
  } = CalendarProperties()  

  const formattedStartDate = startDate.toLocaleDateString('en-GB')
  const formattedEndDate = endDate.toLocaleDateString('en-GB')
  return (
    <div className="mb-4 sm:mb-0">
      <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold"><span>{name}</span></h1>
      
      <h4 className="text-xl md:text-xl text-slate-800 dark:text-slate-100 font-bold"><span>{`${formattedStartDate} - ${formattedEndDate}`}</span></h4>
    </div>
  )
}