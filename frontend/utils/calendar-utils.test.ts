import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';
import {
  generateDaysInMonth,
  getDateFromMinutes,
  goNext,
  goPrev,
  goToday,
  handleDayChange,
  handleMonthChange,
  handleYearChange,
  setView
} from './calendar-utils';
import {
  buildChangeEvent,
  buildMockCalendarRef
} from './calendar-utils.test.data';

describe('generateDaysInMonth', () => {
  describe('return length', () => {
    it('should return 31 items for a 31-day month', () => {
      expect(generateDaysInMonth(31)).toHaveLength(31);
    });

    it('should return 30 items for a 30-day month', () => {
      expect(generateDaysInMonth(30)).toHaveLength(30);
    });

    it('should return 28 items for a 28-day February', () => {
      expect(generateDaysInMonth(28)).toHaveLength(28);
    });

    it('should return 29 items for a 29-day leap year February', () => {
      expect(generateDaysInMonth(29)).toHaveLength(29);
    });
  });

  describe('item shape', () => {
    it('should return items with value and label as strings', () => {
      const result = generateDaysInMonth(5);
      result.forEach((item) => {
        expect(typeof item.value).toBe('string');
        expect(typeof item.label).toBe('string');
      });
    });

    it('should start with day 1 as both value and label', () => {
      const result = generateDaysInMonth(31);
      expect(result[0]).toEqual({ value: '1', label: '1' });
    });

    it('should end with the last day as both value and label', () => {
      const result = generateDaysInMonth(31);
      expect(result[30]).toEqual({ value: '31', label: '31' });
    });

    it('should have matching value and label for every item', () => {
      const result = generateDaysInMonth(10);
      result.forEach((item, index) => {
        const expected = String(index + 1);
        expect(item.value).toBe(expected);
        expect(item.label).toBe(expected);
      });
    });
  });
});

describe('getDateFromMinutes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return midnight when minutes is 0', () => {
    const result = getDateFromMinutes(0);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('should return 1:00 for 60 minutes', () => {
    const result = getDateFromMinutes(60);
    expect(result.getHours()).toBe(1);
    expect(result.getMinutes()).toBe(0);
  });

  it('should return 9:00 for 540 minutes', () => {
    const result = getDateFromMinutes(540);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
  });

  it('should return 22:00 for 1320 minutes', () => {
    const result = getDateFromMinutes(1320);
    expect(result.getHours()).toBe(22);
    expect(result.getMinutes()).toBe(0);
  });

  it('should return 23:59 for 1439 minutes', () => {
    const result = getDateFromMinutes(1439);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
  });
});

describe('goPrev', () => {
  it('should call prev() on the calendar API', () => {
    const { ref, api } = buildMockCalendarRef();
    goPrev(ref);
    expect(api.prev).toHaveBeenCalledOnce();
  });
});

describe('goNext', () => {
  it('should call next() on the calendar API', () => {
    const { ref, api } = buildMockCalendarRef();
    goNext(ref);
    expect(api.next).toHaveBeenCalledOnce();
  });
});

describe('goToday', () => {
  it('should call today() on the calendar API', () => {
    const { ref, api } = buildMockCalendarRef();
    goToday(ref);
    expect(api.today).toHaveBeenCalledOnce();
  });
});

describe('handleDayChange', () => {
  it('should call gotoDate with the date set to the given day', () => {
    const { ref, api } = buildMockCalendarRef();
    const currentDate = new Date('2026-03-01T12:00:00');
    handleDayChange(ref, currentDate, '20');
    expect(api.gotoDate).toHaveBeenCalledOnce();
    const resultDate = new Date(api.gotoDate.mock.calls[0][0] as number);
    expect(resultDate.getDate()).toBe(20);
  });

  it('should call gotoDate with day 1 when day is "1"', () => {
    const { ref, api } = buildMockCalendarRef();
    const currentDate = new Date('2026-03-15T12:00:00');
    handleDayChange(ref, currentDate, '1');
    const resultDate = new Date(api.gotoDate.mock.calls[0][0] as number);
    expect(resultDate.getDate()).toBe(1);
  });
});

describe('handleMonthChange', () => {
  it('should call gotoDate with month set to January when month is "1"', () => {
    const { ref, api } = buildMockCalendarRef();
    const currentDate = new Date('2026-06-15T12:00:00');
    handleMonthChange(ref, currentDate, '1');
    expect(api.gotoDate).toHaveBeenCalledOnce();
    const resultDate = api.gotoDate.mock.calls[0][0] as Date;
    expect(resultDate.getMonth()).toBe(0);
  });

  it('should call gotoDate with month set to December when month is "12"', () => {
    const { ref, api } = buildMockCalendarRef();
    const currentDate = new Date('2026-06-15T12:00:00');
    handleMonthChange(ref, currentDate, '12');
    const resultDate = api.gotoDate.mock.calls[0][0] as Date;
    expect(resultDate.getMonth()).toBe(11);
  });

  it('should not mutate the original currentDate', () => {
    const { ref } = buildMockCalendarRef();
    const currentDate = new Date('2026-06-15T12:00:00');
    const originalMonth = currentDate.getMonth();
    handleMonthChange(ref, currentDate, '1');
    expect(currentDate.getMonth()).toBe(originalMonth);
  });
});

describe('handleYearChange', () => {
  it('should call gotoDate with the year set to the given value', () => {
    const { ref, api } = buildMockCalendarRef();
    const currentDate = new Date('2026-03-15T12:00:00');
    handleYearChange(ref, currentDate, buildChangeEvent('2030'));
    expect(api.gotoDate).toHaveBeenCalledOnce();
    const resultDate = new Date(api.gotoDate.mock.calls[0][0] as number);
    expect(resultDate.getFullYear()).toBe(2030);
  });

  it('should preserve the original month when only the year changes', () => {
    const { ref, api } = buildMockCalendarRef();
    const currentDate = new Date('2026-03-15T12:00:00');
    handleYearChange(ref, currentDate, buildChangeEvent('2030'));
    const resultDate = new Date(api.gotoDate.mock.calls[0][0] as number);
    expect(resultDate.getMonth()).toBe(2); // March
  });
});

describe('setView', () => {
  it('should call changeView on the calendar API with the given view name', () => {
    const { ref, api } = buildMockCalendarRef();
    const setCurrentView = vi.fn();
    setView(ref, 'timeGridWeek', setCurrentView);
    expect(api.changeView).toHaveBeenCalledWith('timeGridWeek');
  });

  it('should call setCurrentView with the given view name', () => {
    const { ref } = buildMockCalendarRef();
    const setCurrentView = vi.fn();
    setView(ref, 'timeGridWeek', setCurrentView);
    expect(setCurrentView).toHaveBeenCalledWith('timeGridWeek');
  });

  it('should call both changeView and setCurrentView for any view name', () => {
    const { ref, api } = buildMockCalendarRef();
    const setCurrentView = vi.fn();
    setView(ref, 'dayGridMonth', setCurrentView);
    expect(api.changeView).toHaveBeenCalledWith('dayGridMonth');
    expect(setCurrentView).toHaveBeenCalledWith('dayGridMonth');
  });
});
