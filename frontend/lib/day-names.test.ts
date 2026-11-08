import { describe, expect, it } from 'vitest';
import { formatDayHeading, shouldShowNameMarker, toDateKey, toDayNameMap } from './day-names';

const TRIP = { start: '2026-11-06', end: '2026-11-09' };

describe('toDateKey', () => {
  it('should format a local date as yyyy-MM-dd with zero padding', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('toDayNameMap', () => {
  it('should map each date to its name', () => {
    expect(toDayNameMap([{ date: '2026-11-07', name: 'Visit to Vatican' }])).toEqual({ '2026-11-07': 'Visit to Vatican' });
  });
});

describe('shouldShowNameMarker', () => {
  it('should show the marker on an unnamed day inside the trip', () => {
    expect(shouldShowNameMarker('2026-11-08', {}, TRIP)).toBe(true);
  });

  it('should not show the marker on a day that already has a name', () => {
    expect(shouldShowNameMarker('2026-11-07', { '2026-11-07': 'Visit to Vatican' }, TRIP)).toBe(false);
  });

  it('should not show the marker on days outside the trip', () => {
    expect(shouldShowNameMarker('2026-11-05', {}, TRIP)).toBe(false);
    expect(shouldShowNameMarker('2026-11-10', {}, TRIP)).toBe(false);
  });

  it('should include the first and last day of the trip', () => {
    expect(shouldShowNameMarker('2026-11-06', {}, TRIP)).toBe(true);
    expect(shouldShowNameMarker('2026-11-09', {}, TRIP)).toBe(true);
  });
});

describe('formatDayHeading', () => {
  it('should return the date alone when the day has no name', () => {
    expect(formatDayHeading('Sat 7 Nov 2026', [])).toBe('Sat 7 Nov 2026');
  });

  it('should append the day name after the date', () => {
    expect(formatDayHeading('Sat 7 Nov 2026', ['Visit to Vatican'])).toBe('Sat 7 Nov 2026 · Visit to Vatican');
  });

  it('should list distinct names once when several calendars name the same day', () => {
    expect(formatDayHeading('Sat 7 Nov 2026', ['Rome', 'Rome', 'Work trip'])).toBe('Sat 7 Nov 2026 · Rome / Work trip');
  });
});
