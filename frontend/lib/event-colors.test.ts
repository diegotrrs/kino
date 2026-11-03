import { describe, expect, it } from 'vitest';
import { DEFAULT_EVENT_COLOR, EVENT_COLORS, getEventTint, isPaletteColor } from './event-colors';

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
