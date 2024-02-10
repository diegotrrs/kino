
jest.mock("../../../../lib/i18n/util"); // Update the path to your util module

import { getStartingBlankDays } from "./getStartingBlankDays";
import { Friday, January, Monday, Saturday, Sunday, Thursday, Tuesday, Wednesday } from "../types";
import { generateSequenceOfDays } from "./generateSequenceOfDays";

describe("getStartingBlankDaysCount", () => {
  describe("When passed a CalendarEntry for Monday", () => {
    it("should return 0 as the count of starting blank days", async () => {
      expect(
        getStartingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Monday,
          month: January,
          year: 2024,
        }])
      ).toEqual([]);
    });
  });

  describe("When passed a CalendarEntry for Tuesday", () => {
    it("should return an array with just Monday as blank day", async () => {
      expect(
        getStartingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Tuesday,
          month: January,
          year: 2024,
        }])
      ).toEqual([Monday]);
    });
  });

  describe("When passed a CalendarEntry for Wednesday", () => {
    it("should return Monday and Tuesday starting blank days", async () => {
      expect(
        getStartingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Wednesday,
          month: January,
          year: 2024,
        }])
      ).toEqual(generateSequenceOfDays(Monday, Tuesday));
    });
  });

  describe("When passed a CalendarEntry for Thursday", () => {
    it("should return Monday, Tuesday and Wednesday as starting blank days", async () => {
      expect(
        getStartingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Thursday,
          month: January,
          year: 2024,
        }])
      ).toEqual(generateSequenceOfDays(Monday, Wednesday));
    });
  });

  describe("When passed a CalendarEntry for Friday", () => {
    it("should return Monday, Tuesday, Wednesday and Thursday as starting blank days", async () => {
      expect(
        getStartingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Friday,
          month: January,
          year: 2024,
        }])
      ).toEqual(generateSequenceOfDays(Monday, Thursday));
    });
  });

  describe("When passed a CalendarEntry for Saturday", () => {
    it("should return Monday, Tuesday, Wednesday, Thursday and Friday as starting blank days", async () => {
      expect(
        getStartingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Saturday,
          month: January,
          year: 2024,
        }])
        ).toEqual(generateSequenceOfDays(Monday, Friday));
    });
  });

  describe("When passed a CalendarEntry for Sunday", () => {
    it("should return Monday, Tuesday, Wednesday, Thursday, Friday and Saturday as starting blank days", async () => {
      expect(
        getStartingBlankDays([{
          dayOfMonth: 1,
          dayOfWeek: Sunday,
          month: January,
          year: 2024,
        }])
      ).toEqual(generateSequenceOfDays(Monday, Saturday));
    });
  });
});
