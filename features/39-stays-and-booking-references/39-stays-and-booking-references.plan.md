# Implementation Plan: 39 — Stays and booking references on every event

Source spec: `features/39-stays-and-booking-references/39-stays-and-booking-references.md` (a delta on feature 23)

## Overview

Three capabilities, built in this order:
1. **Booking reference on every event:** the reference moves from flights and trains' travel details onto the event.
2. **Address on every event,** with a Google Maps link wherever it's shown.
3. **The Stay,** a new travel mode with a bed icon and a stay card.

The reference move comes first because Stay depends on it: a stay has no travel-details row to hold one. Each task is a vertical slice, and the app works after every task.

## Architecture Decisions

- **Two-step migration (expand, then contract).**
  - **Step 1** (`add_event_booking_reference_and_stays.sql`): adds `events.booking_reference` and `deleted_events.booking_reference`, copies the existing references across, and widens the `CHECK` to allow `'stay'`. It only adds things, so the **currently deployed** backend keeps working after it runs.
  - **Step 2** (`drop_travel_booking_reference.sql`): copies once more anything written in the gap, then drops the old columns. It runs **only after** the new backend is live.
  - `init.sql` gets the final shape straight away. CI builds from it, and the new code never reads the old column.
- **One place for the reference.** The schema, crud, redaction, archive and restore all read and write `events.booking_reference`. `TRAVEL_FIELDS_BY_MODE` and `TravelDetailsIn/Out` stop mentioning it, so the per-mode validation and the travel subquery get simpler, not more complex.
- **Hiding the reference from visitors moves up a level.** `_without_booking_references` blanks `event.booking_reference` on **every** event for non-members, not `travel.booking_reference`. It's still the only path non-members can read events through.
- **Stay is a travel mode with no travel fields.** `TRAVEL_FIELDS_BY_MODE['stay'] = frozenset()`, so `travel` with `'stay'` gets a `422`. `keep_travel_details_for_mode` and `set_travel_details` treat Stay like `NULL` and delete the row: a row exists only for flights and trains.
- **Maps through one helper.** `getGoogleMapsUrl(address)` in `lib/maps.ts`, unit-tested, is used by every address link. Each link opens in a new tab with `rel='noopener noreferrer'`. In rows it sits above the open-event layer (`relative z-10`), like the REF chip.
- **`CalendarEvent` carries the address and the reference.** It gains `location` and `bookingReference`, mapped in `dbEventToCalendarEvent`, the timeline's `toCalendarEvent`, FullCalendar's `extendedProps`, and the form's local copies (save, and restoring after a cancelled drag).

## Dependency Graph

```
T1 Backend: reference on events (migration step 1, init.sql, schema, crud, redaction, archive)
 └── T2 Frontend: reference field on every event; strip and card read it from the event
      ├── T3 Address on every event + Google Maps links        (backend cleaning is in T1)
      └── T4 Stay: backend 'stay' + form option + suggested title
           └── T5 Stay display: month cell, strip, stay card   (uses T3's map link)
T6 Migration step 2 file, e2e 18-stays-and-booking-references, domain terms, final checks ← all
```

## Task List

### Phase 1: A booking reference on every event

#### Task 1: Backend — the reference moves onto the event

**Description:**
- **Migration and schema:** write migration step 1 and give `init.sql` the final shape.
- **`EventCreate` / `EventUpdate` / `EventResponse`:** a top-level `booking_reference` (≤ 20, HTML stripped, blank → `NULL`), and the same cleaning for `location` (≤ 255).
- **Remove `booking_reference`** from `TRAVEL_FIELDS_BY_MODE`, `TravelDetailsIn/Out`, the travel subquery, `TRAVEL_COLUMNS` and the upsert. `booking_reference` sent inside `travel` gets a `422`.
- **Writes:** create and update store `events.booking_reference`; a PATCH that doesn't name it leaves it alone.
- **Hiding:** `_without_booking_references` blanks the top-level field on every event for non-members.
- **Delete and restore:** they carry `events.booking_reference` through `deleted_events`; the travel-details archive no longer has it.
- **Existing tests:** update `test_event_travel.py` (unit and integration) to the new shape.

**Acceptance criteria:**
- [ ] An ordinary event, a flight and a train can each be created and updated with a `booking_reference`. It comes back top-level from create, GET and list, and `travel` no longer contains it.
- [ ] Non-members and anonymous visitors get `booking_reference: null` on every event of a public calendar; owners and editors get the value.
- [ ] Deleting and restoring a calendar keeps every event's reference; a date-only PATCH (a drag) leaves it alone.
- [ ] Migration step 1, applied to a copy of the local database that has flight and train references, copies all of them. The **old** backend code (`main`) still runs its event queries against that database.

**Verification:**
- [ ] `make check`
- [ ] Throwaway database built from `init.sql` the way CI does: the final shape
- [ ] A second throwaway copy of the local database with step 1 applied: references copied, and the old `get_events_by_calendar` SQL still runs

**Dependencies:** None

**Files likely touched:**
- `backend/migrations/add_event_booking_reference_and_stays.sql`, `backend/init.sql`
- `backend/app/schemas/event.py`, `backend/app/crud/events.py`, `backend/app/crud/calendars.py`, `backend/app/routers/events.py`
- `backend/tests/unit/test_event_travel.py`, `backend/tests/integration/test_event_travel.py`

**Estimated scope:** L. It's mostly mechanical but touches every travel path. If it grows, split archive and restore into Task 1b.

#### Task 2: Frontend — a Booking reference field on every event

**Description:**
- **Types:** `Event.booking_reference`; `CalendarEvent.bookingReference`, mapped in the two converters, `extendedProps` and the form's local copies. `TravelDetails` / `TravelField` drop `booking_reference`. `FIELDS_BY_TRAVEL_MODE` loses it.
- **Saving:** `getTravelPayload` stops sending it; create and update send top-level `booking_reference`.
- **Form:** an always-visible **Booking reference** input under the Travel row, for every event.
- **Strip:** shows for **any** event with a reference. Ordinary events get just the REF chip; flights and trains read REF from the event.
- **Boarding pass:** the stub reads the event's reference.
- **e2e:** `createTravelEvent` and `@17` updated to the new payload.

**Acceptance criteria:**
- [ ] An ordinary event saved with a reference shows a copyable REF chip on the Events page and in the phone day sheet, and the reference after a reload.
- [ ] Flights and trains look and behave exactly as before, boarding-pass Copy included, with the reference now read from the event.
- [ ] Visitors never see a reference anywhere.

**Verification:**
- [ ] `npx vitest run lib/travel`; build, lint, `npx tsc --noEmit`
- [ ] `npx playwright test e2e/17-travel-events.spec.ts`, all 7 tests passing with the updated helper
- [ ] A temporary browser test: an ordinary event with a reference shows its REF chip and copies it

**Dependencies:** Task 1

**Files likely touched:** `lib/types.ts`, `utils/data.ts`, `lib/travel.ts` (+ tests), `components/event-form.tsx`, `components/events/travel-fields.tsx`, `travel-strip.tsx`, `travel-card.tsx`, `event-timeline-client.tsx`, `day-sheet.tsx`, `calendar.tsx`, `app/(app)/calendars/[uuid]/page.tsx`, `e2e/helpers/api.ts`, `e2e/17-travel-events.spec.ts`, `messages/*.json`

**Estimated scope:** L. Many files, but each change is small and follows the same pattern.

### Checkpoint: Phase 1
- [ ] `make check`, build, lint and `npm run check` pass
- [ ] References work on ordinary events and on flights and trains; visitors never get one
- [ ] **Review with Diego**

### Phase 2: Address and Stay

#### Task 3: An address on every event, with Google Maps links

**Description:**
- **Helper:** `lib/maps.ts`, where `getGoogleMapsUrl(address)` returns `https://www.google.com/maps/search/?api=1&query=<encoded>`, or `null` for a blank address. Tested.
- **Data:** `CalendarEvent.location`, mapped everywhere `bookingReference` is.
- **Form:** an always-visible **Address** input with a map button (icon, `aria-label`) that opens the link. Read-only visitors see the address as a link.
- **Events timeline:** the existing pin-and-address line becomes a link above the row's overlay.
- **Day sheet:** each row shows its address link.
- **Translations:** labels in all four languages.

**Acceptance criteria:**
- [ ] Any event can be saved with an address, and it persists.
- [ ] Wherever it's shown (form button, timeline, day sheet, a visitor's dialog), tapping it opens Google Maps for the encoded address in a new tab and does **not** open the event.
- [ ] Ordinary events without an address look as they do today, apart from the empty field in the form.

**Verification:**
- [ ] `npx vitest run lib/maps` (encoding of spaces, accents and `&`; blank → null); build and lint
- [ ] A temporary browser test: the link `href` is right in each place, `target="_blank"` is set, and tapping the address in a row doesn't open the event

**Dependencies:** Task 2

**Files likely touched:** `lib/maps.ts` (+ test), `lib/types.ts`, `utils/data.ts`, `components/event-form.tsx`, `components/events/event-timeline-client.tsx`, `components/calendars/day-sheet.tsx`, `app/(app)/calendars/[uuid]/page.tsx`, `messages/*.json`

**Estimated scope:** M

#### Task 4: Stay — backend and form

**Description:**
- **Backend:**
  - `travel_mode` accepts `'stay'`; `travel` with `'stay'` gets a `422`.
  - Mode changes to or from Stay delete or create the travel-details row as the spec says, and keep the reference and location.
- **Frontend:**
  - The Travel row gets **Stay** (`BedDouble` icon); `FIELDS_BY_TRAVEL_MODE.stay = []`.
  - `getSuggestedTitle('stay')` → "Stay", translated.
  - `TravelMode` includes `'stay'`.

**Acceptance criteria:**
- [ ] A member can create a stay with an address and a reference and no title typed; it gets "Stay" (translated) as its title. Switching it to a flight and back keeps the address and reference.
- [ ] The API refuses travel fields on a stay (`422`).

**Verification:**
- [ ] `make check`, with new unit tests for `'stay'` validation and integration tests for the mode changes
- [ ] `npx vitest run lib/travel` (suggested title, fields per mode); build and lint

**Dependencies:** Task 2 (and Task 3 for the address field)

**Files likely touched:** `backend/app/schemas/event.py`, `backend/app/crud/events.py`, the backend tests, `lib/types.ts`, `lib/travel.ts` (+ tests), `components/events/travel-fields.tsx`, `messages/*.json`

**Estimated scope:** M

#### Task 5: Stay — month cell, strip and stay card

**Description:**
- **Month cell:** bed icon + title.
- **Strip:** bed icon + REF chip.
- **Stay card** (`components/events/stay-card.tsx`), at the top of the dialog in edit and read-only mode:
  - header with the bed icon and "Stay";
  - **check-in → check-out**, each a date with its time underneath, in the app's language;
  - the address as a map link;
  - a stub with the reference and Copy.

  Phones get the stacked layout with a full-width 44px copy button. Empty fields are left out, and it works in light and dark.

**Acceptance criteria:**
- [ ] A stay shows the bed icon and title in the month view, the icon and REF in the timeline and day sheet, and the stay card in the dialog. No number of nights appears anywhere.
- [ ] The card's Copy copies the reference and its address opens Google Maps. Visitors get the card without the reference.

**Verification:**
- [ ] Build and lint
- [ ] A temporary browser test with screenshots at 1280 and 390px, light and dark, in English and Spanish

**Dependencies:** Tasks 3 and 4

**Files likely touched:** `components/events/stay-card.tsx` (new), `components/event-form.tsx`, `components/events/travel-strip.tsx`, `components/calendar.tsx`, `lib/travel.ts`, `messages/*.json`

**Estimated scope:** M

### Checkpoint: Phase 2
- [ ] `make check`, build, lint and `npm run check` pass
- [ ] Stays, addresses and references look right on desktop and phone, in two languages
- [ ] **Review with Diego**

### Phase 3: Finish

#### Task 6: Migration step 2, e2e spec, domain terms, final checks

**Description:**
- **Step 2:** `backend/migrations/drop_travel_booking_reference.sql`. It copies once more anything where `events.booking_reference IS NULL`, then drops `booking_reference` from both travel tables.
- **`e2e/18-stays-and-booking-references.spec.ts`:**
  - a stay with an address and a reference (month cell, strip, card, Copy, map `href`)
  - an ordinary event's REF chip and map link
  - visitors get no reference
  - the stay card in Spanish

  Each test is confirmed to fail with the code it guards broken.
- **`domain-terms.md`:** add **Stay** and **Address**, and update **Travel details** (no reference) and **Travel mode** (+ stay).
- **Spec:** set `Status: implemented`.

**Acceptance criteria:**
- [ ] Every spec success criterion (1–9) can be ticked.
- [ ] A throwaway database built from step 1, then step 2, matches `init.sql`.

**Verification:**
- [ ] Confirm the :8000 backend is on `.env.local`
- [ ] `make check`; `npm run build && npm run lint && npm run check`

**Dependencies:** Tasks 1–5

**Files likely touched:** `backend/migrations/drop_travel_booking_reference.sql`, `frontend/e2e/18-stays-and-booking-references.spec.ts`, `frontend/e2e/helpers/api.ts`, `domain-terms.md`

**Estimated scope:** M

### Checkpoint: Complete (deploy runbook)
- [ ] **Before merging:** run `add_event_booking_reference_and_stays.sql` (step 1) on production. It only adds things, and the live backend keeps working.
- [ ] Merge, then check production: references, stays, addresses.
- [ ] **After that, and only with Diego's go-ahead:** run `drop_travel_booking_reference.sql` (step 2) on production.

## Parallelisation

- **Task 3 and Task 4** both need Task 2 and could run side by side, but they both change `event-form.tsx` and the message files, so it's simpler to do them in order.
- **Task 5** needs Task 3 (map links) and Task 4 (Stay exists).

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The column move breaks the live app mid-deploy | **High** | Expand then contract: step 1 only adds things and runs before merging; step 2 runs only after the deploy is checked. Task 1 runs the old code against a step-1 database |
| References written between step 1 and the deploy are lost | Med | Step 2 copies again first (`WHERE events.booking_reference IS NULL`); the gap is minutes |
| The reference leaks to visitors through the new top-level field | High | Hidden in the same router path as before, now for every event; unit, integration and e2e tests (T1, T2, T6) |
| Moving the reference breaks the flight and train UI (boarding pass, REF chip) | Med | `@17` must pass unchanged in behaviour in Task 2 |
| A map link inside a row also opens the event | Low | The same `relative z-10` approach as the REF chip; a browser test in Task 3 |
| `EventForm` keeps growing | Med | The address and reference fields can go in a small `event-detail-fields.tsx` if needed; the stay card gets its own file |

## Open Questions

None. Both spec questions are resolved (an address on every event with maps links; no nights).
