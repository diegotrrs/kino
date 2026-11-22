import posthog              from 'posthog-js';
import { getAnalyticsToken } from './config';

export type ConsentStatus = 'granted' | 'denied' | 'pending';

// null when analytics isn't configured: PostHog was never started, so there's nothing to ask about
export const getConsentStatus = (): ConsentStatus | null =>
  getAnalyticsToken() ? posthog.get_explicit_consent_status() : null;

// Accept: PostHog may store its visitor id and capture events. Decline: nothing is stored on the device.
export const setConsent = (isGranted: boolean): void => {
  if (!getAnalyticsToken()) {
    return;
  }
  if (isGranted) {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
};
