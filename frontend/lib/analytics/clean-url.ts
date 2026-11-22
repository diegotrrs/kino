import type { CaptureResult, Properties } from 'posthog-js';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
// Any property whose value is a URL, a path or a referrer, e.g. $current_url, $pathname, $initial_referrer
const URL_PROPERTY = /(url|pathname|referrer)$/i;
// The page title could one day hold a calendar's name
const DROPPED_PROPERTIES = ['title', '$title'];

// A public calendar's uuid is its access link, so it never leaves the browser
export const cleanPath = (path: string): string => path.replace(UUID, ':uuid');

// Keeps where a visitor came from (utm_*) and drops everything else in the query, like a reset token
export const cleanUrl = (value: string): string => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value.startsWith('/') ? cleanPath(value.split(/[?#]/)[0]) : value;
  }
  const kept = [...url.searchParams].filter(([key]) => key.startsWith('utm_'));
  const query = kept.length > 0 ? `?${new URLSearchParams(kept).toString()}` : '';
  return `${url.origin}${cleanPath(url.pathname)}${query}`;
};

const cleanProperties = (properties: Properties): Properties =>
  Object.fromEntries(
    Object.entries(properties)
      .filter(([key]) => !DROPPED_PROPERTIES.includes(key))
      .map(([key, value]) => [key, URL_PROPERTY.test(key) && typeof value === 'string' ? cleanUrl(value) : value]),
  );

// PostHog's before_send: runs on every event before it leaves the browser
export const cleanEvent = (event: CaptureResult | null): CaptureResult | null => {
  if (!event) {
    return null;
  }
  return {
    ...event,
    properties: cleanProperties(event.properties),
    ...(event.$set && { $set: cleanProperties(event.$set) }),
    ...(event.$set_once && { $set_once: cleanProperties(event.$set_once) }),
  };
};
