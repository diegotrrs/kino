/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect } from 'react'
import { CalendarProperties } from './calendar-properties'

export interface Event {
  eventStart: Date
  eventEnd: Date | null
  eventName: string
  eventColor: string
}

export default function CalendarTable() {

  const {
    name,
    dayNames,
    daysInMonth,
    startingBlankDays,
    endingBlankDays,
    isToday,
    renderDays,
  } = CalendarProperties()  


  useEffect(() => {
    renderDays()
  }, [])

  return (
    <div className="bg-white dark:bg-slate-800 rounded-sm shadow overflow-hidden">

      {/* Days of the week */}
      <div className="grid grid-cols-7 gap-px border-b border-slate-200 dark:border-slate-700">
        {
          dayNames.map(day => {
            return (
              <div className="px-1 py-3" key={day}>
                <div className="text-slate-500 text-sm font-medium text-center lg:hidden">{day.substring(0, 3)}</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center hidden lg:block">{day}</div>
              </div>
            )
          })
        }
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">
        {/* Diagonal stripes pattern */}
        <svg className="sr-only">
          <defs>
            <pattern id="stripes" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(135)">
              <line className="stroke-current text-slate-200 dark:text-slate-700 opacity-50" x1="0" y="0" x2="0" y2="5" strokeWidth="2" />
            </pattern>
          </defs>
        </svg>
        {/* Empty cells (previous month) */}
        {
          startingBlankDays.map(blankday => {
            return (
              <div className="bg-slate-50 dark:bg-slate-800 h-20 sm:h-28 lg:h-36" key={blankday}>
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                  <rect width="100%" height="100%" fill="url(#stripes)" />
                </svg>
              </div>
            )
          })
        }
        {/* Days of the current month */}
        {
          daysInMonth.map(day => {
            return (
              <div className="relative bg-white dark:bg-slate-800 h-20 sm:h-28 lg:h-36 overflow-hidden" key={day}>
                <div className="h-full flex flex-col justify-between">
                  {/* Events */}
                  <div className="grow flex flex-col relative p-0.5 sm:p-1.5 overflow-hidden">
                  
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-slate-800 to-transparent pointer-events-none" aria-hidden="true"></div>
                  </div>
                  {/* Cell footer */}
                  <div className="flex justify-between items-center p-0.5 sm:p-1.5">                   
                    {/* Day number */}
                    <button className={`inline-flex ml-auto w-6 h-6 items-center justify-center text-xs sm:text-sm dark:text-slate-300 font-medium text-center rounded-full hover:bg-indigo-100 dark:hover:bg-slate-600 ${isToday(day) && 'text-indigo-500'}`}>{day}</button>
                  </div>
                </div>
              </div>
            )
          })
        }
        {/* Empty cells (next month) */}
        {
          endingBlankDays.map(blankday => {
            return (
              <div className="bg-slate-50 dark:bg-slate-800 h-20 sm:h-28 lg:h-36" key={blankday}>
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                  <rect width="100%" height="100%" fill="url(#stripes)" />
                </svg>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}