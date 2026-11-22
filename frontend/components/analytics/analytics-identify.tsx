'use client';
import {
  AUTH_EVENT_COOKIE,
  getAuthEventFromCookies
}                          from '@/lib/analytics/auth-event';
import { getAnalyticsToken } from '@/lib/analytics/config';
import {
  identifyUser,
  track
}                          from '@/lib/analytics/events';
import { useLocale }       from 'next-intl';
import { useEffect }       from 'react';

// In the app shell: links this browser's visits to the member, and records a sign-up or login the server left
export const AnalyticsIdentify = ({ userId }: { userId: number }): null => {
  const locale = useLocale();

  useEffect(() => {
    if (!getAnalyticsToken()) {
      return;
    }
    identifyUser(userId, locale);
    const authEvent = getAuthEventFromCookies(document.cookie);
    if (!authEvent) {
      return;
    }
    if (authEvent.name === 'user_signed_up') {
      track('user_signed_up', authEvent.properties);
    } else {
      track('user_logged_in');
    }
    document.cookie = `${AUTH_EVENT_COOKIE}=; Max-Age=0; path=/`;
  }, [userId, locale]);

  return null;
};
