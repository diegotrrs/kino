import type { TravelDetails } from '@/lib/types';

export const buildFlightDetails = (overrides: Partial<TravelDetails> = {}): TravelDetails => ({
  origin: 'LHR',
  destination: 'FCO',
  number: 'BA 2490',
  terminal: '5',
  gate: 'B32',
  coach: null,
  seat: '14A',
  booking_reference: 'K7XQ2M',
  ...overrides,
});
