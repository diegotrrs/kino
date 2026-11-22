# Implementation Plan: 5 — Analytics with PostHog

Status: approved decisions (see Resolved Questions); waiting for the PostHog project token

## Overview

Add PostHog product analytics to the frontend to answer:
- **Where do people come from, and where do they drop off?** Landing → sign-up → first calendar → first event.
- **Which features get used?** Flights, trains and stays, checklists, expenses, sharing, Hot Trips.
- **Do people come back?**

It also covers notifications (an email or Slack message when someone signs up or creates a calendar).

This version covers only:
- page views;
- a fixed catalogue of named events;
- identified users.

It doesn't send any user content: no calendar or event names, no addresses, no booking references, no emails.

## Architecture Decisions

- **posthog-js on the client only (V1).** It's initialised in `frontend/instrumentation-client.ts`, the Next.js 15.3+ hook PostHog recommends for the App Router; we're on Next 16.1. Events are captured on the client right after a server action succeeds.
  - **posthog-node isn't needed yet.** Every event we want happens in the browser, and client capture respects the consent choice in one place.
- **EU Cloud, behind a same-domain proxy.**
  - `next.config.ts` rewrites a neutral path (e.g. `/kp`) to `eu.i.posthog.com` and `eu-assets.i.posthog.com`.
  - It also needs `skipTrailingSlashRedirect: true`; without it, Next.js answers PostHog's `/e/` and `/flags/` with a 308 redirect.
  - `api_host: '/kp'`, `ui_host: 'https://eu.posthog.com'`.
  - Ad blockers catch obvious names like `/analytics` or `/posthog`.
- **Off unless configured.** `posthog.init` runs only when `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set, and it's set in Vercel's **Production** environment only, not Preview, so PR previews (`*.vercel.app`) send nothing. Local dev, CI and e2e send nothing either, so tests don't pollute the data and the shared e2e user is never tracked. For trying analytics locally, use a separate "Kino (dev)" PostHog project token in `.env.local`, never the production one.
- **Consent:** `cookieless_mode: 'on_reject'`.
  - **Before the user answers:** nothing is stored and nothing is sent.
  - **After they accept:** `opt_in_capturing()`, which gives full journeys across sessions.
  - **After they reject:** cookieless, so nothing is stored on the device (see Open Question 1).
- **`before_send` cleans every event before it leaves the browser.** It's one tested function in `lib/analytics/clean-url.ts`, and it applies to `$current_url`, `$pathname`, `$referrer` and `$prev_pageview_pathname`:
  - **Calendar UUIDs are replaced with `:uuid`.** A public calendar's UUID *is* its access link (`/calendars/3f2a…` → `/calendars/:uuid`).
  - **The whole query string is dropped, except `utm_*`.** `/reset-password?token=…` carries a live password-reset token.
- **Autocapture is off, and so is session replay (V1).**
  - Autocapture records the text of what people click, and in Kino that includes event and calendar titles. Named events are cleaner and safer.
  - Replay can be turned on later with `maskAllInputs: true` and `maskTextSelector: '*'`.
- **Identify by user id only.**
  - `posthog.identify(String(user.id))` runs once per session from the app shell, which already loads the user from `/api/auth/me`. This links the anonymous landing-page visit to the account.
  - Person properties: only `locale` and `signed_up_at`. No email, no name.
  - `posthog.reset()` runs on log-out.
- **One typed `track()` helper.**
  - `lib/analytics/events.ts` defines every event name and its allowed properties as a TypeScript union.
  - Calling `track('calendar_created', { source: 'hot_trip' })` with a wrong name or property is a type error.
  - Components never import posthog directly, so the catalogue below is the full list of what Kino sends.
- **Login and sign-up redirect from a server action, so the client never sees "success".**
  1. The action sets a short-lived, non-httpOnly cookie, `kino_auth_event=signed_up|logged_in`.
  2. After the redirect, the client `AnalyticsIdentify` component in the app shell identifies the user, captures the event, and deletes the cookie.

## What PostHog records automatically

`$pageview` and `$pageleave` on every route change (`capture_pageview: 'history_change'`, part of the current `defaults`). The pages, as PostHog will see them after cleaning:

| Page (cleaned path) | Route file | What it tells you |
|---|---|---|
| `/` | `app/(marketing)/page.tsx` | Landing visits, and where they came from (referrer, `utm_*`) |
| `/trips/:slug` | `app/(marketing)/trips/[slug]/page.tsx` | Which Hot Trips destinations attract visitors. The slug is public, so it's kept |
| `/signup`, `/login` | `app/(marketing)/signup`, `login` | Top of the sign-up funnel |
| `/forgot-password`, `/reset-password` | `app/(marketing)/…` | How often people get locked out. The token is stripped |
| `/home` | `app/(app)/home/page.tsx` | Daily use |
| `/calendars` | `app/(app)/calendars/page.tsx` | My Calendars |
| `/calendars/create` | `app/(app)/calendars/create/page.tsx` | Intent to create (compare with `calendar_created`) |
| `/calendars/:uuid` | `app/(app)/calendars/[uuid]/page.tsx` | Planning sessions. Plus `calendar_viewed`, below, for owner, editor or visitor |
| `/calendars/:uuid/edit` | `app/(app)/calendars/[uuid]/edit/page.tsx` | Settings, members and sharing |
| `/events` | `app/(app)/events/page.tsx` | The Events timeline |
| `/feedback` | `app/(app)/feedback/page.tsx` | Feedback and wishlist |
| `/settings`, `/settings/deleted-calendars` | `app/(app)/settings/…` | Settings, and recovering deleted calendars |
| `/about` | `app/(app)/about/page.tsx` | About |

## Events to track

These are captured with `track()` right after the action succeeds. **No property ever holds user-written text.**

### Account
| Event | When | Properties |
|---|---|---|
| `user_signed_up` | First app page after sign-up (cookie hand-off) | `from_hot_trip` (bool), `hot_trip_slug?` |
| `user_logged_in` | First app page after login (cookie hand-off) | — |
| `user_logged_out` | Log-out clicked, before `reset()` | — |
| `password_reset_requested` | Forgot-password form succeeds | — |
| `password_reset_completed` | Reset form succeeds | — |

### Calendars
| Event | When | Properties |
|---|---|---|
| `calendar_created` | `createCalendar` / `createTripCalendar` succeed | `source` (`blank` \| `hot_trip`), `hot_trip_slug?`, `has_start_date` |
| `calendar_viewed` | Calendar page opens | `role` (`owner` \| `editor` \| `visitor`), `is_public`, `event_count` |
| `calendar_updated` | Edit form saved | `changed` (`name` and/or `start_date`) |
| `calendar_visibility_changed` | Public switch toggled | `is_public` |
| `calendar_share_link_used` | Copy link, WhatsApp, Messenger or Email in the share dialog | `channel` |
| `calendar_member_invited` | Invite succeeds | `role` (never the email) |
| `calendar_member_removed` | Member removed | — |
| `calendar_favourited` | Star toggled | `is_favourite` |
| `calendar_deleted` / `calendar_restored` | Delete, or restore in Settings | — |

### Events (trip items)
| Event | When | Properties |
|---|---|---|
| `event_created` | Event form saved (add) | `travel_mode` (`none` \| `flight` \| `train` \| `stay`), `has_address`, `has_booking_reference`, `has_description`, `is_multi_day`, `link_count`, `expense_count`, `kept_suggested_title`, `from` (`calendar` \| `events_page` \| `day_sheet`) |
| `event_updated` | Event form saved (edit) | `travel_mode`, `travel_mode_changed` |
| `event_moved` | Dragged in the month view | — |
| `event_deleted` | Deleted from the dialog or timeline | `from` |
| `event_link_added` / `event_expense_added` | Added to an event | `currency` (expenses only) |
| `booking_reference_copied` | Copy on the REF chip, a card or the field | `from` (`chip` \| `travel_card` \| `stay_card` \| `field`) |
| `address_map_opened` | Address link tapped | `from` (`timeline` \| `day_sheet` \| `stay_card` \| `form`) |

### Planning features
| Event | When | Properties |
|---|---|---|
| `day_named` / `day_name_removed` | Day name saved or removed | — |
| `checklist_item_added` / `checklist_item_completed` / `checklist_reordered` | Checklist actions | `via` (`keyboard` \| `drag`) for reorder |
| `calendar_expense_added` | General expense added | `currency` |
| `expenses_summary_opened` | Expenses drawer or panel opened | — |
| `hot_trip_cta_clicked` | "Plan this trip" on `/trips/:slug` | `hot_trip_slug` |

### App
| Event | When | Properties |
|---|---|---|
| `feedback_submitted` | Feedback sent | — (never the text) |
| `wishlist_voted` | Vote toggled | `wishlist_id`, `voted` |
| `language_changed` | Locale switched | `locale` |
| `currency_changed` | Currency changed in Settings | `currency` |
| `theme_toggled` | Theme toggle | `theme` |

## What to build in PostHog (no code)

- **Dashboard "Kino health":**
  - weekly sign-ups;
  - calendars created;
  - events created, broken down by `travel_mode`;
  - weekly active users;
  - top pages and referrers.
- **Funnels:**
  - **Activation:** `/` page view → `user_signed_up` → `calendar_created` → `event_created`, within 7 days.
  - **Hot Trips:** `/trips/:slug` → `hot_trip_cta_clicked` → `user_signed_up` → `calendar_created` with `source = hot_trip`.
  - **Sharing:** `calendar_created` → `calendar_visibility_changed` (public) or `calendar_member_invited` → `calendar_viewed` with `role = visitor`.
- **Paths** from `/` and from `/calendars/:uuid`: how people actually move.
- **Retention:** users doing `event_created` week over week.
- **Notifications** (from the earlier question):
  - **Subscription:** the dashboard by email, weekly.
  - **Alert:** `user_signed_up` > 0 per day, by email.
  - **Real-time:** optionally, a Slack destination for `calendar_created`.
- **Filter yourself out:** a cohort or test-account filter on your own user ids.

## Task List

### Phase 1: Foundation
#### Task 1: Install, proxy and safe init
- Add `posthog-js@1`.
- Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` to `.env.example`, and to Vercel production only.
- Add the `next.config.ts` rewrites and `skipTrailingSlashRedirect`.
- Add `instrumentation-client.ts`. It initialises only when the token is set, with:
  - EU hosts through the proxy;
  - the current `defaults` date;
  - `autocapture: false`, `disable_session_recording: true`;
  - `person_profiles: 'identified_only'`, `respect_dnt: true`, `cookieless_mode: 'on_reject'`;
  - `before_send`.
- Add `lib/analytics/clean-url.ts`.

**Acceptance criteria:**
- [ ] Unit tests for `clean-url`:
  - calendar UUIDs are replaced in paths and full URLs;
  - the query string is dropped and `utm_*` kept;
  - `/reset-password?token=x` becomes `/reset-password`;
  - trip slugs are kept.
- [ ] With no token set (dev, CI, e2e), nothing is loaded or sent. An e2e check counts requests to `/kp/` and expects 0.
- [ ] `npm run build`, `npm run lint` and `npm run check` pass.

#### Task 2: Consent banner
- Add a small, translated banner (Accept / Reject) in the root layout, shown only when the token is set and no choice has been made.
- Accept → `opt_in_capturing()`. Reject → stays cookieless.
- Settings gets a "Usage analytics" switch to change the choice later.
- Add a line to the privacy policy or About page.

**Acceptance criteria:**
- [ ] No PostHog cookie or storage, and no events, before a choice. Events start after Accept. An e2e test uses a test token and intercepts requests to the proxy.
- [ ] Banner text exists in en, es, pt and de, and the banner fits a 390px phone.

### Checkpoint: Foundation
- [ ] Review with Diego. Then deploy, accept on production, and see a page view in PostHog with a cleaned URL.

### Phase 2: Journeys
#### Task 3: Identify, log-out and auth events
- Add `AnalyticsIdentify` to the app shell: `identify(String(user.id))` with `locale`.
- Add the `kino_auth_event` cookie hand-off for `user_signed_up` and `user_logged_in`.
- On log-out: `user_logged_out`, then `reset()`.

**Acceptance criteria:**
- [ ] The anonymous landing visit and the account show up as one person in PostHog.
- [ ] No email or name is sent anywhere.
- [ ] The cookie is consumed once.

#### Task 4: The `track()` helper, and calendar and event events
- Add `lib/analytics/events.ts`: a typed catalogue and `track()`, which does nothing when disabled.
- Wire up the Calendars and Events (trip items) tables above.

**Acceptance criteria:**
- [ ] Unit tests check that `track` sends the given properties, and that wrong names or properties fail type-checking (`tsc`).
- [ ] e2e, with a test token and an intercepted proxy: creating a calendar and a stay sends `calendar_created` and `event_created { travel_mode: 'stay' }`. No payload contains the calendar name, event title, address or reference.

#### Task 5: The remaining events
- Planning features, sharing, feedback, settings and Hot Trips, per the tables.

**Acceptance criteria:**
- [ ] Every catalogue event fires once from its trigger (spot-checked in e2e for sharing, checklist and Hot Trips).

### Checkpoint: Complete
- [ ] Build the dashboard, funnels, alert and subscription in PostHog.
- [ ] Add to `CLAUDE.md`: "new features add their events to `lib/analytics/events.ts`".
- [ ] Review with Diego.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Secrets in URLs (reset token, calendar UUIDs) reach PostHog | **High** | `before_send` cleaning, unit-tested, plus an e2e payload check |
| User content leaks through autocapture or replay | High | Both off in V1; only named events with whitelisted properties |
| Tracking before consent (GDPR, mostly EU users) | High | `cookieless_mode: 'on_reject'` and a banner; e2e asserts nothing is sent before a choice |
| Tests or dev pollute the data | Med | Init only with a token, which is only set in Vercel production |
| Ad blockers drop events | Med | Same-domain proxy on a neutral path |
| Too few people accept, so the data is thin | Med | Rejected sessions still give cookieless, anonymous counts. Review acceptance after a month |

## Resolved Questions

1. **Consent:** a banner, with full journeys for people who accept. `cookieless_mode: 'on_reject'` means nothing is stored or sent before a choice.
2. **Session replay:** off in V1. If it's turned on later, use `maskAllInputs: true` and `maskTextSelector: '*'`.
3. **Visitors to public calendars:** tracked anonymously, with `calendar_viewed` and `role = visitor`, once they accept the banner. The sharing funnel needs it.
4. **PostHog project:** Diego creates an **EU Cloud** project and shares its project token. It's public by design, and goes into Vercel's Production environment only.
5. **Proxy path:** `/kp`.
6. **Building the dashboards:** with a PostHog personal API key, the insights, dashboard, funnels and alert can be created through PostHog's API instead of by hand. The email subscription and the Slack connection still need a few clicks.
