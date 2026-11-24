import type { CreateEventInput, TravelDetails, TravelField, TravelMode } from '@/lib/types';

// The order fields appear in the form and are sent to the API; anything else is rejected by the API
export const FIELDS_BY_TRAVEL_MODE = {
  flight: ['origin', 'destination', 'number', 'terminal', 'gate', 'seat'],
  train: ['origin', 'destination', 'coach', 'seat'],
  stay: [],
} as const satisfies Record<TravelMode, readonly TravelField[]>;

export const TRAVEL_FIELD_MAX_LENGTH: Record<TravelField, number> = {
  origin: 60,
  destination: 60,
  number: 10,
  terminal: 10,
  gate: 10,
  coach: 10,
  seat: 10,
};

// Any event can have a booking reference, so it isn't a ticket field
export const BOOKING_REFERENCE_MAX_LENGTH = 20;

const ALL_TRAVEL_FIELDS = Object.keys(TRAVEL_FIELD_MAX_LENGTH) as TravelField[];

export type TravelFormValues = Record<TravelField, string>;

export const getTravelFormValues = (travel: TravelDetails | null | undefined): TravelFormValues =>
  Object.fromEntries(ALL_TRAVEL_FIELDS.map((field) => [field, travel?.[field] ?? ''])) as TravelFormValues;

// What the form sends: only the chosen mode's filled-in fields; no mode means an ordinary event
export const getTravelPayload = (
  travelMode: TravelMode | null,
  values: Partial<TravelFormValues>,
): Pick<CreateEventInput, 'travel_mode' | 'travel'> => {
  if (travelMode === null) {
    return { travel_mode: null };
  }
  // A stay has no ticket, so nothing typed into a flight's fields before switching goes with it
  if (travelMode === 'stay') {
    return { travel_mode: 'stay' };
  }
  const filled = FIELDS_BY_TRAVEL_MODE[travelMode]
    .map((field) => [field, values[field]?.trim() ?? ''] as const)
    .filter(([, value]) => value !== '');
  return { travel_mode: travelMode, travel: Object.fromEntries(filled) };
};

// The route isn't a chip: it's shown on its own (strip header, month cell, card)
const ROUTE_FIELDS: ReadonlySet<TravelField> = new Set(['origin', 'destination']);

export type TravelChip = { field: TravelField | 'booking_reference'; value: string };

// A flight's or train's ticket chips, then the booking reference (any event can have one) last
export const getTravelChips = (
  travelMode: TravelMode | null | undefined,
  travel: TravelDetails | null | undefined,
  bookingReference: string | null | undefined,
): TravelChip[] => {
  const ticketChips: TravelChip[] = travelMode && travel
    ? FIELDS_BY_TRAVEL_MODE[travelMode]
      .filter((field) => !ROUTE_FIELDS.has(field))
      .flatMap((field) => {
        const value = travel[field];
        return value ? [{ field, value }] : [];
      })
    : [];
  return bookingReference ? [...ticketChips, { field: 'booking_reference', value: bookingReference }] : ticketChips;
};

export const getRouteLabel = (travel: TravelDetails | null | undefined): string | null => {
  const origin = travel?.origin;
  const destination = travel?.destination;
  if (origin && destination) {
    return `${origin} → ${destination}`;
  }
  if (origin) {
    return `${origin} →`;
  }
  if (destination) {
    return `→ ${destination}`;
  }
  return null;
};

// Month cells are tiny: a flight or train shows its route there, and the title only when there's no route
export const getCalendarCellLabel = (
  title: string,
  travelMode: TravelMode | null | undefined,
  travel: TravelDetails | null | undefined,
): string => (travelMode ? getRouteLabel(travel) ?? title : title);

export type SuggestedTitle =
  | { key: 'flightTo' | 'trainTo'; values: { destination: string } }
  | { key: 'flightNumber'; values: { number: string } }
  | { key: 'flight' | 'train' | 'stay'; values: Record<string, never> };

// A flight or train doesn't need a typed title: this names it from the ticket (translated by the caller)
export const getSuggestedTitle = (
  travelMode: TravelMode | null,
  values: Partial<TravelFormValues>,
): SuggestedTitle | null => {
  if (travelMode === null) {
    return null;
  }
  if (travelMode === 'stay') {
    return { key: 'stay', values: {} };
  }
  const destination = values.destination?.trim();
  if (destination) {
    return { key: travelMode === 'flight' ? 'flightTo' : 'trainTo', values: { destination } };
  }
  const number = values.number?.trim();
  if (travelMode === 'flight' && number) {
    return { key: 'flightNumber', values: { number } };
  }
  return { key: travelMode, values: {} };
};

// The card shows the route, number, seat and reference in their own places; this is its middle row
const CARD_DETAIL_FIELDS: Record<TravelMode, readonly TravelField[]> = {
  flight: ['terminal', 'gate'],
  train: ['coach'],
  stay: [],
};

export const getTravelCardDetails = (travelMode: TravelMode, travel: TravelDetails): TravelChip[] =>
  CARD_DETAIL_FIELDS[travelMode].flatMap((field) => {
    const value = travel[field];
    return value ? [{ field, value }] : [];
  });

// The same shape the API returns: unfilled fields are null, never empty strings
export const toTravelDetails = (travel: Partial<TravelDetails> | undefined): TravelDetails =>
  Object.fromEntries(ALL_TRAVEL_FIELDS.map((field) => [field, travel?.[field] || null])) as TravelDetails;

// An airline code (2 characters with at least one letter, or 3 letters) then 1–4 digits and an optional
// letter: BA500, U28001, 3K123, TP1351A
const FLIGHT_NUMBER = /^([a-z][a-z0-9]|\d[a-z]|[a-z]{3})\d{1,4}[a-z]?$/;

// Flightradar24's page for a flight number; null when the number can't be tracked, so no link is shown
export const getFlightTrackingUrl = (number: string | null | undefined): string | null => {
  const code = (number ?? '').replace(/[\s-]/g, '').toLowerCase();
  if (!FLIGHT_NUMBER.test(code)) {
    return null;
  }
  return `https://www.flightradar24.com/data/flights/${code}`;
};
