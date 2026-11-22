import { describe, expect, it } from 'vitest';
import { cleanEvent, cleanPath, cleanUrl } from './clean-url';
import { buildPageview, CALENDAR_UUID } from './clean-url.test.data';

describe('cleanPath', () => {
  it('should replace a calendar uuid, since a public calendar\'s uuid is its access link', () => {
    expect(cleanPath(`/calendars/${CALENDAR_UUID}`)).toBe('/calendars/:uuid');
    expect(cleanPath(`/calendars/${CALENDAR_UUID}/edit`)).toBe('/calendars/:uuid/edit');
  });

  it('should replace an uppercase uuid too', () => {
    expect(cleanPath(`/calendars/${CALENDAR_UUID.toUpperCase()}`)).toBe('/calendars/:uuid');
  });

  it('should keep paths with nothing private, like a Hot Trips slug', () => {
    expect(cleanPath('/trips/kyoto-in-autumn')).toBe('/trips/kyoto-in-autumn');
    expect(cleanPath('/events')).toBe('/events');
  });
});

describe('cleanUrl', () => {
  it('should drop a password reset token from the query string', () => {
    expect(cleanUrl('https://kinocalendars.com/reset-password?token=abc123')).toBe('https://kinocalendars.com/reset-password');
  });

  it('should drop every query parameter except utm ones, which say where a visitor came from', () => {
    expect(cleanUrl('https://kinocalendars.com/?utm_source=instagram&ref=x&utm_campaign=autumn')).toBe(
      'https://kinocalendars.com/?utm_source=instagram&utm_campaign=autumn',
    );
  });

  it('should replace calendar uuids and drop the fragment', () => {
    expect(cleanUrl(`https://kinocalendars.com/calendars/${CALENDAR_UUID}#day-3`)).toBe('https://kinocalendars.com/calendars/:uuid');
  });

  it('should clean a referrer from another site the same way', () => {
    expect(cleanUrl('https://mail.example.com/inbox?thread=42')).toBe('https://mail.example.com/inbox');
  });

  it('should leave values that are not URLs alone', () => {
    expect(cleanUrl('$direct')).toBe('$direct');
  });
});

describe('cleanEvent', () => {
  it('should clean every URL, path and referrer property of an event', () => {
    const event = cleanEvent(buildPageview({
      $referrer: `https://kinocalendars.com/calendars/${CALENDAR_UUID}/edit?tab=members`,
      $prev_pageview_pathname: `/calendars/${CALENDAR_UUID}`,
      $session_entry_url: 'https://kinocalendars.com/reset-password?token=abc123',
    }));

    expect(event?.properties).toMatchObject({
      $current_url: 'https://kinocalendars.com/calendars/:uuid',
      $pathname: '/calendars/:uuid',
      $referrer: 'https://kinocalendars.com/calendars/:uuid/edit',
      $prev_pageview_pathname: '/calendars/:uuid',
      $session_entry_url: 'https://kinocalendars.com/reset-password',
      $host: 'kinocalendars.com',
    });
    expect(JSON.stringify(event)).not.toContain(CALENDAR_UUID);
    expect(JSON.stringify(event)).not.toContain('abc123');
  });

  it('should clean the person properties set once with an event, like the first URL a person saw', () => {
    const event = cleanEvent({
      ...buildPageview(),
      $set_once: { $initial_current_url: 'https://kinocalendars.com/reset-password?token=abc123', $initial_pathname: `/calendars/${CALENDAR_UUID}` },
    });

    expect(event?.$set_once).toEqual({
      $initial_current_url: 'https://kinocalendars.com/reset-password',
      $initial_pathname: '/calendars/:uuid',
    });
  });

  it('should drop the page title, which could one day hold a calendar\'s name', () => {
    const event = cleanEvent(buildPageview({ title: 'Rome with Ana', $title: 'Rome with Ana' }));

    expect(event?.properties).not.toHaveProperty('title');
    expect(event?.properties).not.toHaveProperty('$title');
  });

  it('should keep other properties as they are', () => {
    const event = cleanEvent({ ...buildPageview(), event: 'event_created', properties: { travel_mode: 'stay', has_address: true } });

    expect(event?.properties).toEqual({ travel_mode: 'stay', has_address: true });
  });
});
