'use client';
import {
  AUTH_EVENT_COOKIE,
  getAuthEventFromCookies
}                          from '@/lib/analytics/auth-event';
import { track }           from '@/lib/analytics/events';
import { useEffect }       from 'react';

// On the login page: a finished password reset redirects here, leaving the hand-off cookie behind
export const PasswordResetEvent = (): null => {
  useEffect(() => {
    if (getAuthEventFromCookies(document.cookie)?.name !== 'password_reset_completed') {
      return;
    }
    track('password_reset_completed');
    document.cookie = `${AUTH_EVENT_COOKIE}=; Max-Age=0; path=/`;
  }, []);

  return null;
};
