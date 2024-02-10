'use client'

import { useState } from 'react'
import { useCalendarContext } from './calendar-context'

export const CalendarProperties = () => {
  const monthNames: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const {
    today,
    name,
    startDate,
    endDate,
    currentMonth,
    setCurrentMonth,
    currentYear,
    setCurrentYear,    
  } = useCalendarContext()
  const [daysInMonth, setDaysInMonth] = useState<number[]>([])
  const [startingBlankDays, setStartingBlankDays] = useState<number[]>([])
  const [endingBlankDays, setEndingBlankDays] = useState<number[]>([])  

  const eventColor = (color: string): string => {
    switch (color) {
      case 'sky':
        return 'text-white bg-sky-500'
      case 'indigo':
        return 'text-white bg-indigo-500'
      case 'yellow':
        return 'text-white bg-amber-500'
      case 'emerald':
        return 'text-white bg-emerald-500'
      case 'red':
        return 'text-white bg-rose-400'
      default:
        return ''
    }
  }

  const isToday = (date: number): boolean => {
    const day = new Date(currentYear, currentMonth, date)
    return today.toDateString() === day.toDateString()
  }

  

  // TODO: [] From now if the start date is 15-09-2023 and the end date is 16-10-2023, the first days of the month are grayed out.
  const renderDays = (): void => {
    const numberOfDaysCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    console.log("🚀 ~ renderDays ~ numberOfDaysCurrentMonth:", numberOfDaysCurrentMonth)

    // starting empty cells (previous month)
    //  Sunday is 0 and Saturday is 6.
    // startingDayOfWeek = first day week of the month
    // 5 is Friday
    const startingDayOfWeek: number = new Date(currentYear, currentMonth).getDay()
    console.log("🚀 ~ renderDays ~ startingDayOfWeek:", startingDayOfWeek)

    // 0 ... 4 => startingBlankDaysArray
    
    let startingBlankDaysArray: number[] = []
    for (let i = 1; i <= startingDayOfWeek; i++) {
      startingBlankDaysArray.push(i)
    }

    // ending empty cells (next month)
    const endingDayOfWeek: number = new Date(currentYear, currentMonth + 1, 0).getDay()
    // day that the month ends on
    let endingBlankDaysArray: number[] = []
    for (let i = 1; i < 7 - endingDayOfWeek; i++) {
      endingBlankDaysArray.push(i)
    }

    // current month cells
    let daysArray: number[] = []
    for (let i = 1; i <= numberOfDaysCurrentMonth; i++) {
      daysArray.push(i)
    }

    // startingBlankDaysArray [1, 2, 3, 4, 5]
    console.log("🚀 ~ renderDays ~ startingBlankDaysArray:", startingBlankDaysArray)
    // endingBlankDaysArray []
    console.log("🚀 ~ renderDays ~ endingBlankDaysArray:", endingBlankDaysArray)

    // daysInMonth  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]

    
    setStartingBlankDays(startingBlankDaysArray)
    setEndingBlankDays(endingBlankDaysArray)
    setDaysInMonth(daysArray)
  }

  return {
    today,
    startDate,
    endDate,
    name,
    monthNames,
    dayNames,
    currentMonth,
    setCurrentMonth,
    currentYear,
    setCurrentYear,
    daysInMonth,
    setDaysInMonth,
    startingBlankDays,
    setStartingBlankDays,
    endingBlankDays,
    setEndingBlankDays,
    eventColor,
    isToday,
    renderDays,
  }
}
