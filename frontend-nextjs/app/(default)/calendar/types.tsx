
// Month Ids
// // https://en.wikipedia.org/wiki/ISO_week_date


export const January = 1;
export const February = 2;
export const March = 3;
export const April = 4;
export const May = 5;
export const June = 6;
export const July = 7;
export const August = 8;
export const September = 9;
export const October = 10;
export const November = 11;
export const December = 12;


// See Datetime's WeekdayNumbers
// Monday is first day of the week.
// 1 is Monday and 7 is Sunday
// https://en.wikipedia.org/wiki/ISO_week_date
export const Monday = 1;
export const Tuesday = 2;
export const Wednesday = 3;
export const Thursday = 4;
export const Friday = 5;
export const Saturday = 6;
export const Sunday = 7;

export type CalendarDataModel = CalendarEntry[]

export type CalendarEntry = {
  dayOfMonth: number, // eg: 27
  dayOfWeek: number, // eg: 4 (Friday)
  month: number, // eg: 1 (February)
  year: number, // eg: 2024
}

export type MonthNames = Record<number, string>
export type DayNames = Record<number, string>

export type CalendarViewModel = {  
  globalData: {
    monthNames: MonthNames
    dayNames: DayNames
  }
  startingBlankDaysIds: number[],
  endingBlankDaysIds: number[],
  data: CalendarEntry[] // This might need to diverge from the CalendarDataModel (something like a CalendarEntry with additional properties)
}






