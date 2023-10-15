'use client'

import { createContext, useContext, useState } from 'react'

interface CalendarContextProps {
  name: string
  today: Date
  startDate: Date
  endDate: Date
  currentMonth: number
  setCurrentMonth: (currentMonth: number) => void
  currentYear: number
  setCurrentYear: (currentMonth: number) => void
}

const CalendarContext = createContext<CalendarContextProps | undefined>(undefined)

//const ChatRoomProvider: React.FC<ChatRoomProviderProps> = ({ chatRoomId, chatRoomName, projectId, children }) => {


export const CalendarProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const today = new Date()
  const name = "My first trip"
  const startDate = new Date('2023-10-15')
  const endDate = new Date('2023-11-16')
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth())
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear())
  return (
    <CalendarContext.Provider value={{ name, today, startDate, endDate, currentMonth, setCurrentMonth, currentYear, setCurrentYear }}>
      {children}
    </CalendarContext.Provider>
  )
}

export const useCalendarContext = () => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}