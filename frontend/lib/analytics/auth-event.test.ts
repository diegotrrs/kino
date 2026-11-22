import { describe, expect, it } from 'vitest';
import { AUTH_EVENT_COOKIE, getAuthEventFromCookies, getSignUpSource } from './auth-event';

describe('getSignUpSource', () => {
  it('should credit Hot Trips when the visitor was on their way to plan a Hot Trip', () => {
    expect(getSignUpSource('/calendars/create?trip=kyoto-in-autumn')).toBe('hot_trip');
  });

  it('should credit a shared calendar when the visitor was viewing one', () => {
    expect(getSignUpSource('/calendars/3f2a9c4e-7b1d-4e8a-9c2f-1a2b3c4d5e6f')).toBe('shared_calendar');
  });

  it('should count anything else as a direct sign-up', () => {
    expect(getSignUpSource('/home')).toBe('direct');
    expect(getSignUpSource('/calendars/create')).toBe('direct');
  });
});

describe('getAuthEventFromCookies', () => {
  it('should read a sign-up and where it came from', () => {
    expect(getAuthEventFromCookies(`locale=es; ${AUTH_EVENT_COOKIE}=signed_up.hot_trip`)).toEqual({
      name: 'user_signed_up',
      properties: { source: 'hot_trip' },
    });
  });

  it('should read a login', () => {
    expect(getAuthEventFromCookies(`${AUTH_EVENT_COOKIE}=logged_in`)).toEqual({ name: 'user_logged_in' });
  });

  it('should ignore anything else in the cookie, so it can\'t be used to send arbitrary events or properties', () => {
    expect(getAuthEventFromCookies(`${AUTH_EVENT_COOKIE}=calendar_deleted`)).toBeNull();
    expect(getAuthEventFromCookies(`${AUTH_EVENT_COOKIE}=signed_up.someone@example.com`)).toBeNull();
  });

  it('should give nothing when there is no hand-off cookie', () => {
    expect(getAuthEventFromCookies('locale=es; currency=EUR')).toBeNull();
    expect(getAuthEventFromCookies('')).toBeNull();
  });
});
