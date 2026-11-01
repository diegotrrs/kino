'use client';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction
}                      from 'react';
import { calendarRef } from './data';

export const generateDaysInMonth = (daysInMonth: number) => {
  const daysArray = [];

  for (let day = 1; day <= daysInMonth; day++) {
    daysArray.push({
      value: String(day),
      label: String(day),
    });
  }

  return daysArray;
}

export const getDateFromMinutes = (minutes: number) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set time to midnight
  now.setMinutes(minutes);
  return now;
};


export const goPrev = (calendarRef: calendarRef) => {
  const calendarApi = calendarRef.current!.getApi();
  calendarApi.prev();
}

export const goNext = (calendarRef: calendarRef) => {
  const calendarApi = calendarRef.current!.getApi();
  calendarApi.next();
}

export const handleDayChange = (
  calendarRef: calendarRef,
  currentDate: Date,
  day: string
) => {
  const calendarApi = calendarRef.current!.getApi();
  const newDate = currentDate.setDate(Number(day));
  calendarApi.gotoDate(newDate);
}

export const handleMonthChange = (
  calendarRef: calendarRef,
  currentDate: Date,
  month: string
) => {
  const calendarApi = calendarRef.current!.getApi();
  const newDate = new Date(currentDate);
  newDate.setMonth(Number(month) - 1);
  calendarApi.gotoDate(newDate);
}

export const handleYearChange = (
  calendarRef: calendarRef,
  currentDate: Date,
  e: ChangeEvent<HTMLInputElement>
) => {
  const calendarApi = calendarRef.current!.getApi();
  const newDate = currentDate.setFullYear(Number(e.target.value));
  calendarApi.gotoDate(newDate);
}

export const setView = (
  calendarRef: calendarRef,
  viewName: string,
  setCurrentView: Dispatch<SetStateAction<string>>
) => {
  const calendarApi = calendarRef.current!.getApi();
  setCurrentView(viewName);
  calendarApi.changeView(viewName);
}
