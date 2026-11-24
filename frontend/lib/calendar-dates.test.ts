import { describe, expect, it } from 'vitest';
import { isEndBeforeStart } from './calendar-dates';

const TODAY = new Date(2026, 10, 24, 9, 30);

describe('isEndBeforeStart', () => {
  it('should be false when there is no end date', () => {
    expect(isEndBeforeStart(new Date(2026, 10, 26), undefined, TODAY)).toBe(false);
  });

  it('should be false when the end date is the same day as the start date', () => {
    expect(isEndBeforeStart(new Date(2026, 10, 26), new Date(2026, 10, 26, 23, 0), TODAY)).toBe(false);
  });

  it('should be true when the end date is the day before the start date', () => {
    expect(isEndBeforeStart(new Date(2026, 10, 26), new Date(2026, 10, 25), TODAY)).toBe(true);
  });

  it('should compare against today when there is no start date', () => {
    expect(isEndBeforeStart(undefined, new Date(2026, 10, 23), TODAY)).toBe(true);
    expect(isEndBeforeStart(undefined, new Date(2026, 10, 24), TODAY)).toBe(false);
  });
});
