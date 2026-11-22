// PostHog EU Cloud, called directly from the browser. A same-domain proxy would also carry Kino's cookies,
// including the login token, so it waits for a proxy that strips them (GitHub issue #42).
export const ANALYTICS_HOST = 'https://eu.i.posthog.com';
export const ANALYTICS_UI_HOST = 'https://eu.posthog.com';

// Analytics only runs where a PostHog project token is set (Vercel Production)
export const getAnalyticsToken = (): string | undefined => process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || undefined;
