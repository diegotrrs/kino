import { cleanEvent }        from '@/lib/analytics/clean-url';
import {
  ANALYTICS_HOST,
  ANALYTICS_UI_HOST,
  getAnalyticsToken
}                            from '@/lib/analytics/config';
import posthog               from 'posthog-js';

// Runs once in the browser before the app starts (Next.js). Without a token (local dev, CI, e2e, previews)
// PostHog isn't even initialised, so nothing is loaded or sent.
const token = getAnalyticsToken();

if (token) {
  posthog.init(token, {
    api_host: ANALYTICS_HOST,
    ui_host: ANALYTICS_UI_HOST,
    defaults: '2026-08-30',
    // Named events only: autocapture would record the text people click, like event and calendar titles
    autocapture: false,
    disable_session_recording: true,
    // Kino doesn't use feature flags, so skip the /flags call. It also stops remote settings loading, so the
    // features we want are switched on here: web vitals only (page speed, no user content).
    advanced_disable_flags: true,
    capture_performance: { web_vitals: true, network_timing: false },
    person_profiles: 'identified_only',
    respect_dnt: true,
    // Nothing is stored or sent until the visitor answers the consent banner
    cookieless_mode: 'on_reject',
    before_send: cleanEvent,
  });
}
