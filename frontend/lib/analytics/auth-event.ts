// Sign-up and login finish with a server-side redirect, so the browser never sees them succeed. The action leaves
// this short-lived cookie, and the first app page reads it, records the event and deletes it.
export const AUTH_EVENT_COOKIE = 'kino_auth_event';
export const AUTH_EVENT_MAX_AGE_SECONDS = 60;

export type SignUpSource = 'hot_trip' | 'shared_calendar' | 'direct';

const SIGN_UP_SOURCES: readonly SignUpSource[] = ['hot_trip', 'shared_calendar', 'direct'];
const SHARED_CALENDAR_PATH = /^\/calendars\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export type AuthEvent =
  | { name: 'user_signed_up'; properties: { source: SignUpSource } }
  | { name: 'user_logged_in' };

// Where the visitor was heading when they signed up: a Hot Trip's "Plan this trip", or a shared calendar
export const getSignUpSource = (redirectPath: string): SignUpSource => {
  const [path, query = ''] = redirectPath.split('?');
  if (path === '/calendars/create' && new URLSearchParams(query).has('trip')) {
    return 'hot_trip';
  }
  return SHARED_CALENDAR_PATH.test(path) ? 'shared_calendar' : 'direct';
};

export const getAuthEventCookieValue = (event: AuthEvent): string =>
  event.name === 'user_signed_up' ? `signed_up.${event.properties.source}` : 'logged_in';

// Only the known values are accepted, so the cookie can't be used to send arbitrary events or properties
export const getAuthEventFromCookies = (cookieHeader: string): AuthEvent | null => {
  const value = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_EVENT_COOKIE}=([^;]*)`))?.[1];
  if (value === 'logged_in') {
    return { name: 'user_logged_in' };
  }
  const source = value?.startsWith('signed_up.') ? value.slice('signed_up.'.length) : undefined;
  const knownSource = SIGN_UP_SOURCES.find((candidate) => candidate === source);
  return knownSource ? { name: 'user_signed_up', properties: { source: knownSource } } : null;
};
