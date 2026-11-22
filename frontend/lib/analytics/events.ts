import posthog                from 'posthog-js';
import type { SignUpSource }  from './auth-event';
import { getAnalyticsToken }  from './config';

import type { TravelMode }  from '@/lib/types';

type Currency = string;

// Every event Kino sends and the only properties each may carry. Nothing here may hold text a user wrote
// (calendar or event names, addresses, booking references, emails, feedback). New features add their events here.
export type AnalyticsEvents = {
  // Account
  user_signed_up: { source: SignUpSource };
  user_logged_in: undefined;
  user_logged_out: undefined;
  password_reset_requested: undefined;
  password_reset_completed: undefined;

  // Calendars
  calendar_created: { source: 'blank' | 'hot_trip'; hot_trip_slug?: string; has_start_date: boolean };
  calendar_viewed: { role: 'owner' | 'editor' | 'visitor'; is_public: boolean; event_count: number };
  calendar_updated: { changed: ('name' | 'start_date')[] };
  calendar_visibility_changed: { is_public: boolean; from: 'share_dialog' | 'settings' };
  calendar_share_link_used: { channel: 'copy' | 'whatsapp' | 'messenger' | 'email' };
  calendar_member_invited: undefined;
  calendar_member_removed: undefined;
  calendar_favourited: { is_favourite: boolean };
  calendar_deleted: undefined;
  calendar_restored: undefined;

  // Events (trip items)
  event_created: {
    travel_mode: TravelMode | 'none';
    has_address: boolean;
    has_booking_reference: boolean;
    has_description: boolean;
    is_multi_day: boolean;
    link_count: number;
    expense_count: number;
    kept_suggested_title: boolean;
    from: 'calendar' | 'events_page';
  };
  event_updated: { travel_mode: TravelMode | 'none'; travel_mode_changed: boolean };
  event_moved: undefined;
  event_deleted: { from: 'dialog' | 'timeline' };
  event_link_added: undefined;
  event_expense_added: { currency: Currency };
  booking_reference_copied: { from: 'chip' | 'travel_card' | 'stay_card' | 'field' };
  address_map_opened: { from: 'timeline' | 'day_sheet' | 'stay_card' | 'form' };

  // Planning features
  day_named: undefined;
  day_name_removed: undefined;
  checklist_item_added: undefined;
  checklist_item_completed: undefined;
  checklist_reordered: { via: 'keyboard' | 'drag' };
  calendar_expense_added: { currency: Currency };
  expenses_summary_opened: undefined;
  hot_trip_cta_clicked: { hot_trip_slug: string };

  // App
  feedback_submitted: undefined;
  wishlist_voted: { wishlist_id: number; voted: boolean };
  language_changed: { locale: string };
  currency_changed: { currency: Currency };
  theme_toggled: { theme: string };
};

export type AnalyticsEventName = keyof AnalyticsEvents;

type EventName = AnalyticsEventName;
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
