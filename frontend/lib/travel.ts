import type { CreateEventInput, TravelDetails, TravelField, TravelMode } from '@/lib/types';

// The order fields appear in the form and are sent to the API; anything else is rejected by the API
export const FIELDS_BY_TRAVEL_MODE = {
  flight: ['origin', 'destination', 'number', 'terminal', 'gate', 'seat', 'booking_reference'],
  train: ['origin', 'destination', 'coach', 'seat', 'booking_reference'],
} as const satisfies Record<TravelMode, readonly TravelField[]>;

export const TRAVEL_FIELD_MAX_LENGTH: Record<TravelField, number> = {
  origin: 60,
  destination: 60,
  number: 10,
  terminal: 10,
  gate: 10,
  coach: 10,
  seat: 10,
  booking_reference: 20,
};

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
  const filled = FIELDS_BY_TRAVEL_MODE[travelMode]
    .map((field) => [field, values[field]?.trim() ?? ''] as const)
    .filter(([, value]) => value !== '');
  return { travel_mode: travelMode, travel: Object.fromEntries(filled) };
};
