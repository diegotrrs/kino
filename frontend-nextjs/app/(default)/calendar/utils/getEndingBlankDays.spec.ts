

import { getEndingBlankDays } from "./getEndingBlankDays";
import { February, Friday, January, March, Monday, Thursday } from "../types";

describe("getEndingBlankDaysCount", () => {
  describe("When passed a CalendarEntry for Jan 1 2024", () => {
    it("should return 1, 2, 3 and 4 as the ending blank days since they are the first days of the next month ", async () => {
      expect(
        getEndingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Monday,
          month: January,
          year: 2024,
        }])
      ).toEqual([1, 2, 3, 4]); //1, 2, 3 and 4 are the first days of the next month (dayOfTheMonth)
    });
  });

  describe("When passed a CalendarEntry for Feb 1 2024", () => {
    it("should return 1, 2, 3 and 4 as the ending blank days since they are the first days of the next month ", async () => {
      expect(
        getEndingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Thursday,
          month: February,
          year: 2024,
        }])
      ).toEqual([1, 2, 3]); //1, 2, 3  are the first days of the next month (dayOfTheMonth)
    });
  });

  describe("When passed a CalendarEntry for March 1 2024", () => {
    it("should return an empty array as the ending blank days since this month ends on a Sunday", async () => {
      expect(
        getEndingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Friday,
          month: March,
          year: 2024,
        }])
      ).toEqual([]); //1, 2, 3  are the first days of the next month (dayOfTheMonth)
    });
  });  
});
