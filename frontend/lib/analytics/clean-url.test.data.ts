import type { CaptureResult } from 'posthog-js';

export const CALENDAR_UUID = '3f2a9c4e-7b1d-4e8a-9c2f-1a2b3c4d5e6f';

export const buildPageview = (overrides: Partial<CaptureResult['properties']> = {}): CaptureResult => ({
  uuid: 'event-uuid',
  event: '$pageview',
  properties: {
    $current_url: `https://kinocalendars.com/calendars/${CALENDAR_UUID}?from=home`,
    $pathname: `/calendars/${CALENDAR_UUID}`,
    $host: 'kinocalendars.com',
    ...overrides,
  },
});
