import { describe, expect, it } from 'vitest';
import {
  FIELDS_BY_TRAVEL_MODE,
  getCalendarCellLabel,
  getFlightTrackingUrl,
  getRouteLabel,
  getSuggestedTitle,
  getTravelCardDetails,
  getTravelChips,
  getTravelFormValues,
  getTravelPayload,
  toTravelDetails,
} from './travel';
import { buildFlightDetails } from './travel.test.data';

describe('FIELDS_BY_TRAVEL_MODE', () => {
  it('should give flights a flight number, terminal and gate but no coach', () => {
    expect(FIELDS_BY_TRAVEL_MODE.flight).toEqual(['origin', 'destination', 'number', 'terminal', 'gate', 'seat']);
  });

  it('should give trains a coach but no flight number, terminal or gate', () => {
    expect(FIELDS_BY_TRAVEL_MODE.train).toEqual(['origin', 'destination', 'coach', 'seat']);
  });
});

describe('FIELDS_BY_TRAVEL_MODE for a stay', () => {
  it('should give a stay no ticket fields', () => {
    expect(FIELDS_BY_TRAVEL_MODE.stay).toEqual([]);
  });
});

describe('getTravelPayload', () => {
  it('should send a stay with no travel details, even if ticket fields were filled in before switching', () => {
    expect(getTravelPayload('stay', { origin: 'LHR', seat: '14A' })).toEqual({ travel_mode: 'stay' });
  });

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

  it('should never send a booking reference inside the ticket, since it belongs to the event', () => {
    const values = { origin: 'LHR', booking_reference: 'K7XQ2M' } as Parameters<typeof getTravelPayload>[1];

    expect(getTravelPayload('flight', values)).toEqual({ travel_mode: 'flight', travel: { origin: 'LHR' } });
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
  it('should list a flight\'s ticket fields in order, without the route, and the booking reference last', () => {
    expect(getTravelChips('flight', buildFlightDetails(), 'K7XQ2M').map((chip) => chip.field)).toEqual([
      'number', 'terminal', 'gate', 'seat', 'booking_reference',
    ]);
  });

  it('should list a train\'s coach, seat and booking reference', () => {
    const train = buildFlightDetails({ number: 'X', terminal: 'X', gate: 'X', coach: '7', seat: '61' });

    expect(getTravelChips('train', train, 'Q4PL9X')).toEqual([
      { field: 'coach', value: '7' },
      { field: 'seat', value: '61' },
      { field: 'booking_reference', value: 'Q4PL9X' },
    ]);
  });

  it('should leave out fields with no value, like a reference hidden from visitors', () => {
    const chips = getTravelChips('flight', buildFlightDetails({ gate: null }), null);

    expect(chips.map((chip) => chip.field)).toEqual(['number', 'terminal', 'seat']);
  });

  it('should give an ordinary event with a booking reference just the reference chip', () => {
    expect(getTravelChips(null, null, 'VM-2035')).toEqual([{ field: 'booking_reference', value: 'VM-2035' }]);
  });

  it('should give a stay just its booking reference chip', () => {
    expect(getTravelChips('stay', null, 'HTL-881')).toEqual([{ field: 'booking_reference', value: 'HTL-881' }]);
  });

  it('should give no chips for an ordinary event without a booking reference', () => {
    expect(getTravelChips(null, null, null)).toEqual([]);
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

describe('getCalendarCellLabel', () => {
  it('should show a flight\'s route instead of its title', () => {
    expect(getCalendarCellLabel('Flight to Rome', 'flight', buildFlightDetails())).toBe('LHR → FCO');
  });

  it('should fall back to the title when a flight has no route', () => {
    const noRoute = buildFlightDetails({ origin: null, destination: null });

    expect(getCalendarCellLabel('Flight to Rome', 'flight', noRoute)).toBe('Flight to Rome');
  });

  it('should keep the title of a stay, which has no route', () => {
    expect(getCalendarCellLabel('Hotel Raphael', 'stay', null)).toBe('Hotel Raphael');
  });

  it('should keep the title of an ordinary event', () => {
    expect(getCalendarCellLabel('Museum', null, null)).toBe('Museum');
  });
});

describe('getSuggestedTitle', () => {
  it('should name a flight after its destination', () => {
    expect(getSuggestedTitle('flight', { destination: 'FCO', number: 'BA 234' })).toEqual({
      key: 'flightTo', values: { destination: 'FCO' },
    });
  });

  it('should fall back to the flight number when there is no destination', () => {
    expect(getSuggestedTitle('flight', { destination: '  ', number: ' BA 234 ' })).toEqual({
      key: 'flightNumber', values: { number: 'BA 234' },
    });
  });

  it('should call it just a flight when neither is known', () => {
    expect(getSuggestedTitle('flight', {})).toEqual({ key: 'flight', values: {} });
  });

  it('should name a train after its destination, or just a train', () => {
    expect(getSuggestedTitle('train', { destination: 'Paris Gare du Nord' })).toEqual({
      key: 'trainTo', values: { destination: 'Paris Gare du Nord' },
    });
    expect(getSuggestedTitle('train', { number: 'ignored for trains' })).toEqual({ key: 'train', values: {} });
  });

  it('should call a stay just a stay', () => {
    expect(getSuggestedTitle('stay', { destination: 'Rome' })).toEqual({ key: 'stay', values: {} });
  });

  it('should suggest nothing for an ordinary event', () => {
    expect(getSuggestedTitle(null, { destination: 'FCO' })).toBeNull();
  });
});

describe('getTravelCardDetails', () => {
  it('should give a flight\'s terminal and gate for the card\'s middle row', () => {
    expect(getTravelCardDetails('flight', buildFlightDetails())).toEqual([
      { field: 'terminal', value: '5' },
      { field: 'gate', value: 'B32' },
    ]);
  });

  it('should give a train\'s coach', () => {
    expect(getTravelCardDetails('train', buildFlightDetails({ coach: '7' }))).toEqual([{ field: 'coach', value: '7' }]);
  });

  it('should leave out details that are not filled in', () => {
    expect(getTravelCardDetails('flight', buildFlightDetails({ terminal: null }))).toEqual([{ field: 'gate', value: 'B32' }]);
  });
});

describe('toTravelDetails', () => {
  it('should turn what the form sends into stored details, with every missing field as null', () => {
    const details = toTravelDetails({ origin: 'MAD', destination: 'BCN' });

    expect(details).toEqual({
      origin: 'MAD', destination: 'BCN', number: null, terminal: null, gate: null, coach: null, seat: null,
    });
  });

  it('should give all-null details when nothing was filled in', () => {
    expect(Object.values(toTravelDetails(undefined)).every((value) => value === null)).toBe(true);
  });
});

describe('getFlightTrackingUrl', () => {
  it('should link to the flight on Flightradar24 with spaces removed and in lower case', () => {
    expect(getFlightTrackingUrl('BA 500')).toBe('https://www.flightradar24.com/data/flights/ba500');
  });

  it('should accept airline codes that contain a digit and numbers with a letter suffix', () => {
    expect(getFlightTrackingUrl('U2 8001')).toBe('https://www.flightradar24.com/data/flights/u28001');
    expect(getFlightTrackingUrl('TP1351A')).toBe('https://www.flightradar24.com/data/flights/tp1351a');
  });

  it('should ignore a dash between the airline code and the number', () => {
    expect(getFlightTrackingUrl('FR-1234')).toBe('https://www.flightradar24.com/data/flights/fr1234');
  });

  it('should give no link when there is no flight number', () => {
    expect(getFlightTrackingUrl(null)).toBeNull();
    expect(getFlightTrackingUrl(undefined)).toBeNull();
    expect(getFlightTrackingUrl('   ')).toBeNull();
  });

  it('should give no link for text that is not a flight number', () => {
    expect(getFlightTrackingUrl('Window')).toBeNull();
    expect(getFlightTrackingUrl('12345')).toBeNull();
    expect(getFlightTrackingUrl('BA/500?x=1')).toBeNull();
  });
});
