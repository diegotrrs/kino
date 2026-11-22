import { describe, expect, it, vi } from 'vitest';
import { track } from './events';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

// These calls are type-checked by `tsc` (npm run build / the typecheck step): each @ts-expect-error must stay an
// error, so the catalogue keeps rejecting unknown events and free-form properties like names or addresses.
describe('the analytics event catalogue', () => {
  it('should only accept known events with their declared properties', () => {
    const calls = (): void => {
      track('calendar_created', { source: 'hot_trip', hot_trip_slug: 'kyoto-in-autumn', has_start_date: true });
      track('event_deleted', { from: 'timeline' });
      track('day_named');

      // @ts-expect-error unknown event
      track('calendar_renamed');
      // @ts-expect-error a property the event doesn't declare, like the calendar's name
      track('calendar_created', { source: 'blank', has_start_date: false, name: 'Rome with Ana' });
      // @ts-expect-error an event with properties needs them
      track('event_deleted');
      // @ts-expect-error a value outside the allowed set
      track('calendar_share_link_used', { channel: 'sms' });
    };

    expect(calls).toBeTypeOf('function');
  });
});
