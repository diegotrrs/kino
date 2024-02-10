import { buildCalendarViewModel } from "./buildCalendarViewModel";


jest.mock('../../../../lib/i18n/util');

//import * as util from '@/lib/i18n/util'
import * as util from '../../../../lib/i18n/util'
import { CalendarDataModel, CalendarViewModel, Friday, Saturday, September, Thursday, Wednesday } from "../types";

// TODO This test is too general. It should be more specific.
describe("buildCalendarViewModel", () => {
  describe("When passed a CalendarModel", () => {
    let calendarModel: CalendarDataModel;

    beforeAll(() => {
      calendarModel = [
        { 
          dayOfMonth: 27,
          dayOfWeek: Wednesday,
          month: September,
          year: 2023,
        },
        { 
          dayOfMonth: 28,
          dayOfWeek: Thursday,
          month: September,
          year: 2023,
        },
        { 
          dayOfMonth: 29,
          dayOfWeek: Friday,
          month: September,
          year: 2023,
        },
        { 
          dayOfMonth: 30,
          dayOfWeek: Saturday,
          month: September,
          year: 2023,
        }
      ]

      const mockGetDaysTranslated = jest.fn();
      const mockGetMonthsTranslated = jest.fn();

      //Provide your desired return values for the mocked functions
      mockGetDaysTranslated.mockReturnValue({
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
        7: 'Sunday',         
      });

      mockGetMonthsTranslated.mockReturnValue({
        1: 'January',
        2: 'February',
        3: 'March',
        4: 'April',
        5: 'May',
        6: 'June',
        7: 'July',
        8: 'August',
        9: 'September',
        10: 'October',
        11: 'November',
        12: 'December'          
      });

    
      jest.spyOn(util, 'getMonthNames').mockImplementation(mockGetMonthsTranslated);
      jest.spyOn(util, 'getDayNames').mockImplementation(mockGetDaysTranslated);
      
    });

    it("should return a valid viewmodel", async () => {      
      const viewModel = buildCalendarViewModel(calendarModel);
      
      const expectedViewModel: CalendarViewModel = {
        data: calendarModel,
        startingBlankDays: [1,2],
        endingBlankDays: [1],
        globalData: {
          monthNames: {
            1: 'January',
            2: 'February',
            3: 'March',
            4: 'April',
            5: 'May',
            6: 'June',
            7: 'July',
            8: 'August',
            9: 'September',
            10: 'October',
            11: 'November',
            12: 'December'          
          },
          dayNames: {
            1: 'Monday',
            2: 'Tuesday',
            3: 'Wednesday',
            4: 'Thursday',
            5: 'Friday',
            6: 'Saturday',
            7: 'Sunday',         
          }
        },
      }
      expect(viewModel).toEqual(expectedViewModel);
    });
      
  });
});
