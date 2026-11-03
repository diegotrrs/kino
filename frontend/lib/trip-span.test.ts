import { describe, expect, it } from 'vitest';
import { getTripSpan } from './trip-span';

describe('getTripSpan', () => {
  it('should end on the latest event date when events run past the start date', () => {
    const span = getTripSpan('2027-05-12', ['2027-05-14', '2027-05-18', '2027-05-13'], '2027-01-01');

    expect(span.end).toBe('2027-05-18');
    expect(span.totalDays).toBe(7);
  });

  it('should be a single day when the calendar has no events', () => {
    const span = getTripSpan('2027-05-12', [], '2027-01-01');

    expect(span.end).toBe('2027-05-12');
    expect(span.totalDays).toBe(1);
  });

  it('should ignore events dated before the start date when finding the end', () => {
    expect(getTripSpan('2027-05-12', ['2027-05-01'], '2027-01-01').end).toBe('2027-05-12');
  });

  it('should report the current day number when today falls inside the trip', () => {
    expect(getTripSpan('2027-05-12', ['2027-05-18'], '2027-05-14').currentDay).toBe(3);
  });

  it('should report no current day when today is before or after the trip', () => {
    expect(getTripSpan('2027-05-12', ['2027-05-18'], '2027-05-11').currentDay).toBeNull();
    expect(getTripSpan('2027-05-12', ['2027-05-18'], '2027-05-19').currentDay).toBeNull();
  });

  it('should accept full timestamps and compare by date only', () => {
    expect(getTripSpan('2027-05-12T00:00:00', ['2027-05-13T23:30:00'], '2027-05-13T08:00:00').currentDay).toBe(2);
  });
});
