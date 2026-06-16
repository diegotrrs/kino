import { describe, expect, it } from 'vitest';
import {
  applyAllDay,
  applyDurationPreset,
  getActiveMinutes,
} from './event-date-range-picker';

const makeDate = (hours: number, minutes: number): Date => {
  const d = new Date('2026-06-19T00:00:00');
  d.setHours(hours, minutes, 0, 0);
  return d;
};

describe('applyDurationPreset', () => {
  it('adds 30 minutes to the start', () => {
    const start = makeDate(8, 0);
    const end = applyDurationPreset(start, 30);
    expect(end.getHours()).toBe(8);
    expect(end.getMinutes()).toBe(30);
  });

  it('adds 60 minutes to the start', () => {
    const start = makeDate(8, 0);
    const end = applyDurationPreset(start, 60);
    expect(end.getHours()).toBe(9);
    expect(end.getMinutes()).toBe(0);
  });

  it('adds 120 minutes to the start', () => {
    const start = makeDate(8, 0);
    const end = applyDurationPreset(start, 120);
    expect(end.getHours()).toBe(10);
    expect(end.getMinutes()).toBe(0);
  });

  it('does not mutate the original start date', () => {
    const start = makeDate(8, 0);
    const original = start.getTime();
    applyDurationPreset(start, 60);
    expect(start.getTime()).toBe(original);
  });
});

describe('applyAllDay', () => {
  it('sets start to 00:00 on the same calendar day', () => {
    const { start } = applyAllDay(makeDate(14, 30));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getDate()).toBe(19);
  });

  it('sets end to 23:59 on the same calendar day', () => {
    const { end } = applyAllDay(makeDate(14, 30));
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getDate()).toBe(19);
  });

  it('does not mutate the original date', () => {
    const source = makeDate(14, 30);
    const original = source.getTime();
    applyAllDay(source);
    expect(source.getTime()).toBe(original);
  });
});

describe('getActiveMinutes', () => {
  it('returns 30 for a 30-minute event', () => {
    expect(getActiveMinutes(makeDate(8, 0), makeDate(8, 30))).toBe(30);
  });

  it('returns 60 for a 1-hour event', () => {
    expect(getActiveMinutes(makeDate(8, 0), makeDate(9, 0))).toBe(60);
  });

  it('returns 120 for a 2-hour event', () => {
    expect(getActiveMinutes(makeDate(8, 0), makeDate(10, 0))).toBe(120);
  });

  it('returns null for an all-day event (00:00 to 23:59)', () => {
    expect(getActiveMinutes(makeDate(0, 0), makeDate(23, 59))).toBeNull();
  });

  it('returns non-null for an arbitrary duration not matching any preset', () => {
    expect(getActiveMinutes(makeDate(8, 0), makeDate(8, 45))).toBe(45);
  });
});
