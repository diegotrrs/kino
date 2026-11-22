import posthog                from 'posthog-js';
import type { SignUpSource }  from './auth-event';
import { getAnalyticsToken }  from './config';

// Every event Kino sends and the only properties each may carry. Nothing here may hold text a user wrote
// (calendar or event names, addresses, booking references, emails).
export type AnalyticsEvents = {
  user_signed_up: { source: SignUpSource };
  user_logged_in: undefined;
  user_logged_out: undefined;
};

type EventName = keyof AnalyticsEvents;
type EventProperties<E extends EventName> = AnalyticsEvents[E] extends undefined ? [] : [properties: AnalyticsEvents[E]];

export const track = <E extends EventName>(event: E, ...[properties]: EventProperties<E>): void => {
  if (!getAnalyticsToken()) {
    return;
  }
  posthog.capture(event, properties);
};

// By id only, with the locale as the one person property: never the email or name
export const identifyUser = (userId: number, locale: string): void => {
  if (!getAnalyticsToken()) {
    return;
  }
  posthog.identify(String(userId), { locale });
};

// Records the log-out as this member, then forgets them so the next person on the device starts anonymous
export const logOutOfAnalytics = (): void => {
  if (!getAnalyticsToken()) {
    return;
  }
  track('user_logged_out');
  posthog.reset();
};
