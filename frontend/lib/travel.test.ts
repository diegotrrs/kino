import { describe, expect, it } from 'vitest';
import { FIELDS_BY_TRAVEL_MODE, getRouteLabel, getTravelChips, getTravelFormValues, getTravelPayload } from './travel';
import { buildFlightDetails } from './travel.test.data';

describe('FIELDS_BY_TRAVEL_MODE', () => {
  it('should give flights a flight number, terminal and gate but no coach', () => {
    expect(FIELDS_BY_TRAVEL_MODE.flight).toEqual(['origin', 'destination', 'number', 'terminal', 'gate', 'seat', 'booking_reference']);
  });

  it('should give trains a coach but no flight number, terminal or gate', () => {
    expect(FIELDS_BY_TRAVEL_MODE.train).toEqual(['origin', 'destination', 'coach', 'seat', 'booking_reference']);
  });
});

describe('getTravelPayload', () => {
  it('should send no travel details for an ordinary event', () => {
    expect(getTravelPayload(null, { origin: 'LHR' })).toEqual({ travel_mode: null });
  });

  it('should send only the fields of the chosen mode, trimmed', () => {
    const payload = getTravelPayload('train', { origin: ' London St Pancras ', gate: 'B32', coach: '7', seat: '61' });

    expect(payload).toEqual({
      travel_mode: 'train',
      travel: { origin: 'London St Pancras', coach: '7', seat: '61' },
    });
  });

  it('should leave out fields that are empty or only spaces', () => {
    expect(getTravelPayload('flight', { origin: 'LHR', gate: '   ', seat: '' })).toEqual({
      travel_mode: 'flight',
      travel: { origin: 'LHR' },
    });
  });
});

describe('getTravelFormValues', () => {
  it('should turn saved details into form values, with missing fields as empty strings', () => {
    const values = getTravelFormValues(buildFlightDetails({ gate: null }));

    expect(values.number).toBe('BA 2490');
    expect(values.gate).toBe('');
    expect(values.coach).toBe('');
  });

  it('should give empty values when there are no details', () => {
    expect(getTravelFormValues(null).origin).toBe('');
  });
});

describe('getTravelChips', () => {
  it('should list a flight\'s ticket fields in order, without the route', () => {
    expect(getTravelChips('flight', buildFlightDetails()).map((chip) => chip.field)).toEqual([
      'number', 'terminal', 'gate', 'seat', 'booking_reference',
    ]);
  });

  it('should list a train\'s coach, seat and booking reference', () => {
    const train = buildFlightDetails({ number: 'X', terminal: 'X', gate: 'X', coach: '7', seat: '61' });

    expect(getTravelChips('train', train)).toEqual([
      { field: 'coach', value: '7' },
      { field: 'seat', value: '61' },
      { field: 'booking_reference', value: 'K7XQ2M' },
    ]);
  });

  it('should leave out fields with no value, like a reference hidden from visitors', () => {
    const chips = getTravelChips('flight', buildFlightDetails({ gate: null, booking_reference: null }));

    expect(chips.map((chip) => chip.field)).toEqual(['number', 'terminal', 'seat']);
  });

  it('should give no chips for an ordinary event', () => {
    expect(getTravelChips(null, null)).toEqual([]);
  });
});

describe('getRouteLabel', () => {
  it('should join origin and destination with an arrow', () => {
    expect(getRouteLabel(buildFlightDetails())).toBe('LHR → FCO');
  });

  it('should show whichever end of the route is known', () => {
    expect(getRouteLabel(buildFlightDetails({ origin: null }))).toBe('→ FCO');
    expect(getRouteLabel(buildFlightDetails({ destination: null }))).toBe('LHR →');
  });

  it('should be null when there is no route', () => {
    expect(getRouteLabel(buildFlightDetails({ origin: null, destination: null }))).toBeNull();
    expect(getRouteLabel(null)).toBeNull();
  });
});
