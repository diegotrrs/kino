import { DateTime } from "luxon";
import { August, CalendarDataModel, December, Friday, January, Monday, October, Saturday, September, Sunday, Tuesday } from "../types";
import { buildCalendarModel } from "./buildCalendarModel";


// TODO [x] Move the month name to the view model.
describe("buildCalendarModel", () => {
  describe("When the endDate is before the startDate ", () => {
    let startDate: DateTime, endDate: DateTime;

    beforeAll(() => {
      startDate = DateTime.fromObject({ day: 23, month: September, year: 2023 });
      endDate = DateTime.fromObject({ day: 25, month: August, year: 2023 });
    });

    it("should throw an exception ", async () => {
      expect(() => {
        buildCalendarModel(startDate, endDate);
      }).toThrow(new Error("End date must be greater than start date"));
    });
  });

  describe("When building a calendar model from a date range within the same month", () => {
    let startDate: DateTime, endDate: DateTime;
    let calendarDataModel: CalendarDataModel;

    beforeAll(() => {
      startDate = DateTime.fromObject({ day: 29, month: September, year: 2023 });
      endDate = DateTime.fromObject({ day: 30, month: September, year: 2023 });
      calendarDataModel = buildCalendarModel(startDate, endDate);
    });

    it("should return a calendar data model with n entries where n is the number of days in the range", async () => {
      expect(calendarDataModel.length).toEqual(2);
    });

    it("should return a calendar data model with each entry with the corresponding day of the week", async () => {
      const daysOfWeeks = calendarDataModel.map(entry => entry.dayOfWeek);
      expect(daysOfWeeks).toEqual([
        Friday,
        Saturday,
      ]);
    });

    it("should return a calendar data model with each entry with the corresponding day of the months", async () => {
      const daysOfWeeks = calendarDataModel.map(entry => entry.dayOfMonth);
      expect(daysOfWeeks).toEqual([29,30]);
    });

    it("should return a calendar data model with each entry with the corresponding month id", async () => {
      const months = calendarDataModel.map(entry => entry.month);
      expect(months).toEqual([September, September]);
    });

    it("should return a calendar data model with each entry with the corresponding year id", async () => {
      const years = calendarDataModel.map(entry => entry.year);
      expect(years).toEqual([2023, 2023]);
    });
  });

  describe("When building a calendar model from a date range across two months", () => {
    let startDate: DateTime, endDate: DateTime;
    let calendarDataModel: CalendarDataModel;

    beforeAll(() => {
      startDate = DateTime.fromObject({ day: 29, month: September, year: 2023 });
      endDate = DateTime.fromObject({ day: 3, month: October, year: 2023 });
      calendarDataModel = buildCalendarModel(startDate, endDate);
    });

    it("should return a calendar data model with n entries where n is the number of days in the range", async () => {
      expect(calendarDataModel.length).toEqual(5);
    });

    it("should return a calendar data model with each entry with the corresponding day of the week", async () => {
      const daysOfWeeks = calendarDataModel.map(entry => entry.dayOfWeek);
      expect(daysOfWeeks).toEqual([
        Friday,
        Saturday,
        Sunday,
        Monday,
        Tuesday,
      ]);
    });

    it("should return a calendar data model with each entry with the corresponding day of the months", async () => {
      const daysOfMonth = calendarDataModel.map(entry => entry.dayOfMonth);
      expect(daysOfMonth).toEqual([
        29,30,1,2,3
      ]);
    });

    it("should return a calendar data model with each entry with the corresponding month id", async () => {
      const months = calendarDataModel.map(entry => entry.month);
      expect(months).toEqual([September, September, October, October, October]);
    });

    it("should return a calendar data model with each entry with the corresponding year id", async () => {
      const years = calendarDataModel.map(entry => entry.year);
      expect(years).toEqual([2023, 2023, 2023, 2023, 2023]);
    });   
     
  });

  describe("When building a calendar model from a date range across two years", () => {
    let startDate: DateTime, endDate: DateTime;
    let calendarDataModel: CalendarDataModel;

    beforeAll(() => {
      startDate = DateTime.fromObject({ day: 30, month: December, year: 2023 });
      endDate = DateTime.fromObject({ day: 2, month: January, year: 2024 });
      calendarDataModel = buildCalendarModel(startDate, endDate);
    });

    it("should return a calendar data model with n entries where n is the number of days in the range", async () => {
      expect(calendarDataModel.length).toEqual(4);
    });

    it("should return a calendar data model with each entry with the corresponding day of the week", async () => {
      const daysOfWeeks = calendarDataModel.map(entry => entry.dayOfWeek);
      expect(daysOfWeeks).toEqual([
        Saturday,        
        Sunday,
        Monday,
        Tuesday,
      ]);
    });

    it("should return a calendar data model with each entry with the corresponding day of the months", async () => {
      const daysOfWeeks = calendarDataModel.map(entry => entry.dayOfMonth);
      expect(daysOfWeeks).toEqual([30,31,1,2]);
    });

    it("should return a calendar data model with each entry with the corresponding month id", async () => {
      const months = calendarDataModel.map(entry => entry.month);
      expect(months).toEqual([December, December, January, January]);
    });

    it("should return a calendar data model with each entry with the corresponding year id", async () => {
      const years = calendarDataModel.map(entry => entry.year);
      expect(years).toEqual([2023, 2023, 2024, 2024]);
    });   
  });

});
