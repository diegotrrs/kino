import { describe, expect, it } from 'vitest';
import { DEFAULT_EVENT_COLOR, EVENT_COLORS, getEventTint, getRecentColors, isPaletteColor } from './event-colors';

describe('isPaletteColor', () => {
  it('should return true for a palette colour regardless of letter case', () => {
    expect(isPaletteColor(EVENT_COLORS[1].hex.toLowerCase())).toBe(true);
  });

  it('should return false for a custom colour that is not in the palette', () => {
    expect(isPaletteColor('#76c7ef')).toBe(false);
  });
});

describe('getEventTint', () => {
  it('should mix the event colour with the card colour at the given amount', () => {
    expect(getEventTint('#C8674A', 20)).toBe('color-mix(in srgb, #C8674A 20%, hsl(var(--card)))');
  });
});

describe('DEFAULT_EVENT_COLOR', () => {
  it('should be the teal palette colour', () => {
    expect(DEFAULT_EVENT_COLOR).toBe('#2F5D62');
  });
});

describe('getRecentColors', () => {
  it('should list custom colours from the newest event first', () => {
    const events = [
      { id: '1', backgroundColor: '#8ec5ec' },
      { id: '3', backgroundColor: '#d9739d' },
      { id: '2', backgroundColor: '#4f8a5b' },
    ];
    expect(getRecentColors(events)).toEqual(['#d9739d', '#4f8a5b', '#8ec5ec']);
  });

  it('should leave out palette colours and events without a colour', () => {
    const events = [
      { id: '1', backgroundColor: EVENT_COLORS[0].hex },
      { id: '2' },
      { id: '3', backgroundColor: '#8ec5ec' },
    ];
    expect(getRecentColors(events)).toEqual(['#8ec5ec']);
  });

  it('should list a colour once even when its letter case differs', () => {
    const events = [
      { id: '1', backgroundColor: '#8EC5EC' },
      { id: '2', backgroundColor: '#8ec5ec' },
    ];
    expect(getRecentColors(events)).toEqual(['#8ec5ec']);
  });

  it('should keep only the given number of colours', () => {
    const events = ['#111111', '#222222', '#333333'].map((hex, i) => ({ id: String(i + 1), backgroundColor: hex }));
    expect(getRecentColors(events, 2)).toEqual(['#333333', '#222222']);
  });
});
