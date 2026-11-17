import { describe, expect, it } from 'vitest';
import { FIELDS_BY_TRAVEL_MODE, getTravelFormValues, getTravelPayload } from './travel';
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
