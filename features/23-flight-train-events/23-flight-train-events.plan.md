# Implementation Plan: 23 — Flight and train events

Source spec: `features/23-flight-train-events/23-flight-train-events.md`

## Overview

Events gain a nullable `travel_mode` (`flight` | `train`) and a 1:1 `event_travel_details` row with the ticket fields. Members choose the mode in the event form. Flights and trains then show:
- a chip strip (direction **B**) on the Events timeline and in the phone day sheet;
- the route in the month cell;
- a boarding-pass card (direction **A**) at the top of the event dialog.

The booking reference is only ever returned to members. The work is in vertical slices: after Phase 1 a member can create and edit a flight or train end to end, and every task after that adds one visible piece.

## Architecture Decisions

- **Travel details are read through a scalar subquery, not a join.** Today's event queries `GROUP BY e.id` around the `json_agg` of links and expenses. Adding `(SELECT row_to_json(t) FROM event_travel_details t WHERE t.event_id = e.id) AS travel` leaves that grouping alone and can't duplicate rows. `create_event`, `get_event`, `get_events` and `get_events_by_calendar` all use it.
- **Writes go through one crud helper.** `set_travel_details(db, event_id, travel_mode, travel)` runs in the same transaction as the event insert or update:
  - mode `NULL` → delete the row;
  - otherwise upsert (`ON CONFLICT (event_id) DO UPDATE`), with the fields that don't apply to the mode stored as `NULL`.
- **The booking reference is redacted in the router.** Non-members can only read events through `list_events` with a `calendar_uuid` on a public calendar: `get_event`, create, update and `get_events` all require membership. That branch sets `travel.booking_reference = None` when the caller has no role. It's one `if`, covered by a unit test.
- **Per-mode validation lives in Pydantic**, matching the existing validators:
  - `EventCreate` / `EventUpdate` gain `travel_mode: Literal['flight', 'train'] | None` and `travel: TravelDetailsIn | None`;
  - a `model_validator` rejects `travel` without a mode, and any field that doesn't belong to the mode (`422`).
  - `EventUpdate` keeps `exclude_unset`, so a calendar drag that sends only dates **never touches the travel details**.
- **The frontend carries travel data in `CalendarEvent`.** It gains `travelMode` and `travel`; `dbEventToCalendarEvent` and the timeline's `toCalendarEvent` map them. FullCalendar receives them as `extendedProps`, which is how `EventItem` reads them.
- **Pure helpers live in `lib/travel.ts`** (fields per mode, chips, route label), so the strip, the card and the form can't drift apart, and each is unit-tested.
- **Schema goes in the migration and in `init.sql`**, which is how CI builds its database. After writing them, build a throwaway database from `init.sql` the way CI does.

## Dependency Graph

```
T1 schema + create/read/update + validation + redaction (backend)
 ├── T2 Event form: Travel row + fields, save (frontend) ──┐
 │                                                          ├── T3 Strip (B) on timeline + day sheet
 │                                                          ├── T4 Month cell: icon + route
 │                                                          ├── T5 Boarding-pass card (A)
 │                                                          └── T6 Changing the travel mode (None / flight↔train)
 └── T7 Archive / restore with the calendar (backend only, parallel to T2–T6)
T8 E2E spec, domain terms, final checks ← all of the above
```

## Task List

### Phase 1: Flights and trains end to end

#### Task 1: Backend — schema, create/read/update, validation, member-only booking reference ✅

**Description:**
- **Schema:** `backend/migrations/add_event_travel_mode.sql` adds `events.travel_mode` with its `CHECK`, `deleted_events.travel_mode`, `event_travel_details` and `deleted_event_travel_details` (with row-level security). The same DDL goes in `backend/init.sql`.
- **Schemas:** `TravelDetailsIn` / `TravelDetailsOut`, plus `travel_mode` and `travel` on `EventCreate`, `EventUpdate` and `EventResponse`, with per-mode validation, HTML stripping and empty strings stored as `NULL`.
- **Crud:** `set_travel_details`, called from `create_event` and `update_event`; the travel subquery in all four reads.
- **Router:** `list_events` redacts the reference for non-members.

**Acceptance criteria:**
- [x] A member can create a flight (all 7 fields) and a train (5 fields). Both come back from `GET /api/events/{id}` and from the calendar's event list with `travel_mode` and `travel`. Existing events return `travel_mode: null` and `travel: null`.
- [x] Each of these is refused with `422` and nothing written: `travel` without a mode; `gate`, `terminal` or `number` on a train; `coach` on a flight; any field over its length.
- [x] A PATCH with only `date` and `start_time` (as a calendar drag sends) leaves `travel` unchanged; a PATCH with `travel` replaces it.
- [x] On a public calendar, an anonymous visitor and a non-member get `booking_reference: null`, while owners and editors get the value.

**Verification:**
- [x] `cd backend && make check`, with new `tests/unit/test_event_travel.py` and `tests/integration/test_event_travel.py`. Unit tests assert that no crud write happens on every refusal.
- [x] Migration applied to the **local** database. A throwaway database built from `init.sql` plus the listed migrations has the new column and tables, then is dropped.

**Dependencies:** None

**Files likely touched:** `backend/migrations/add_event_travel_mode.sql`, `backend/init.sql`, `backend/app/schemas/event.py`, `backend/app/crud/events.py`, `backend/app/routers/events.py`, the two new test files

**Estimated scope:** L. If it runs long, split the redaction and its tests into Task 1b.

#### Task 2: Event form — Travel row and fields, saved and reloaded ✅

**Description:**
- **Types:** `TravelMode` and `TravelDetails` in `lib/types.ts`; `travelMode` and `travel` on `CalendarEvent` (`utils/data.ts`), mapped in `dbEventToCalendarEvent` (calendar page) and `toCalendarEvent` (Events timeline); `CreateEventInput` and the `createEvent` / `updateEvent` server actions send them.
- **Helper:** `lib/travel.ts` gets `FIELDS_BY_TRAVEL_MODE` and `getTravelPayload`, which trims and drops empty values.
- **`EventForm`:** a **Travel: None · Flight · Train** segmented control under the title, then the fields for the chosen mode, with labels and placeholders. It's prefilled in edit mode and read-only for visitors.
- **Translations:** a `travel` set of strings in all four locales.

**Acceptance criteria:**
- [x] Creating an event with Travel = Flight and its fields, then reopening it after a reload, shows the same mode and values. The same goes for Train.
- [x] Travel = None (the default) looks exactly like today's form; ordinary events save as before.
- [x] Every label is translated (en, es, pt, de), and the segmented control works with the keyboard.

**Verification:**
- [x] `npx vitest run lib/travel`; `npm run build && npm run lint && npx tsc --noEmit`
- [x] A temporary browser test against the local stack: create a flight, reload, check the fields; check that an ordinary event's form is unchanged. Delete the test afterwards.

**Dependencies:** Task 1

**Files likely touched:** `lib/types.ts`, `utils/data.ts`, `lib/travel.ts` (+ `.test.ts`, `.test.data.ts`), `app/(app)/events/actions.ts`, `components/event-form.tsx`, `app/(app)/calendars/[uuid]/page.tsx`, `components/events/event-timeline-client.tsx`, `messages/*.json`

**Estimated scope:** L. The form is the biggest piece. If it grows, move the field grid into `components/events/travel-fields.tsx`.

### Checkpoint: Phase 1
- [ ] `make check`, build, lint and unit tests pass
- [ ] A member can create and edit a flight and a train in the UI, and the details persist
- [ ] **Review with Diego.** He tries the form at desktop and phone widths before any display work.

### Phase 2: Showing flights and trains

#### Task 3: Ticket strip (B) on the Events timeline and in the phone day sheet ✅

**Description:**
- **Helpers:** `getTravelChips(mode, travel)` returns the ordered chips with empty values dropped (`BA 2490`, `TERM 5`, `GATE B32`, `SEAT 14A`, `REF …` for flights; `COACH 7`, `SEAT 61`, `REF …` for trains). `getRouteLabel` returns `LHR → FCO`, or `null`.
- **`components/events/travel-strip.tsx`:** the icon (`Plane` / `TrainFront`), the route and wrapping mono chips. `REF` is a button that copies the reference and shows "Copied", rendered only when there's a reference, i.e. for members.
- **Where:** in timeline rows (`event-timeline-client.tsx`) and day sheet rows (`day-sheet.tsx`). Ordinary events don't change.

**Acceptance criteria:**
- [x] The timeline and day sheet rows of a flight and a train show the icon, the route and only the chips that have values. Ordinary event rows are unchanged.
- [x] The strip wraps without overflowing at 390px.
- [x] Tapping `REF` copies the reference; visitors to a public calendar see no `REF` chip.

**Verification:**
- [x] `npx vitest run lib/travel` (chips per mode, empty values dropped, route label); build and lint
- [x] A temporary browser test: the timeline on desktop, the day sheet at 390px, copying to the clipboard, and the public visitor view

**Dependencies:** Task 2

**Files likely touched:** `lib/travel.ts` (+ tests), `components/events/travel-strip.tsx`, `components/events/event-timeline-client.tsx`, `components/calendars/day-sheet.tsx`, `messages/*.json`

**Estimated scope:** M

#### Task 4: Month cell — icon, time and route instead of the title

**Description:** `EventItem` in `components/calendar.tsx` reads `extendedProps.travelMode` and `extendedProps.travel`. For flights and trains it shows the icon, the start time and the route (`✈ 07:15 LHR→FCO`), falling back to the title when there's no route. The calendar page passes the two fields into FullCalendar's events as `extendedProps`.

**Acceptance criteria:**
- [ ] In the month view, a flight shows its icon and route; a flight without a route shows its title; ordinary events look the same as before.
- [ ] Dragging a flight to another day keeps its travel details. (This checks Task 1's PATCH behaviour from the UI.)

**Verification:**
- [ ] `npx vitest run lib/travel`, extended for the cell label if it moves into the helper; build and lint
- [ ] A temporary browser test: the month cell, the fallback to the title, and a drag followed by a reload that keeps the details

**Dependencies:** Task 2

**Files likely touched:** `components/calendar.tsx`, `app/(app)/calendars/[uuid]/page.tsx` (`extendedProps`), possibly `lib/travel.ts`

**Estimated scope:** S

#### Task 5: Boarding-pass card (A) at the top of the event dialog

**Description:** `components/events/travel-card.tsx`, shown at the top of `EventForm` in edit and read-only modes:
- **Desktop / `sm`+ (prototype A):** big origin → destination; a departs / terminal / gate row (trains: departs / coach); a perforated stub with the seat and booking reference and a Copy button.
- **Phones (prototype E):** the same content stacked vertically, with a full-width 44px "Copy booking reference" button.
- Fields with no value are left out; with only a route it's a slim header. The accent is the event's colour. Departure and arrival times come from the event's start and end.

**Acceptance criteria:**
- [ ] Opening a flight or train shows the card above the form fields, at both desktop width and 390px. Ordinary events have no card.
- [ ] Copy copies the reference; visitors see the card without the reference or a Copy button.
- [ ] Missing fields don't leave gaps; the card works in light and dark themes.

**Verification:**
- [ ] Build and lint
- [ ] A temporary browser test with screenshots at 1280 and 390px, in light and dark, plus copying to the clipboard
- [ ] Compare the screenshots against prototypes A and E

**Dependencies:** Task 2

**Files likely touched:** `components/events/travel-card.tsx`, `components/event-form.tsx`, `messages/*.json`

**Estimated scope:** M

#### Task 6: Changing the travel mode

**Description:**
- **Backend:** `set_travel_details` handles a mode change. Setting the mode to `NULL` deletes the row. Switching between flight and train keeps the shared fields (origin, destination, seat, booking reference) and clears the ones that don't apply.
- **Frontend:** the form keeps the fields you've typed while you switch between modes before saving, but only saves the ones for the chosen mode. Choosing None sends `travel_mode: null`.

**Acceptance criteria:**
- [ ] Changing a flight to None and saving removes its details; after a reload it's an ordinary event everywhere (no strip, no card, the title back in the month cell).
- [ ] Changing a flight to a train keeps the route, seat and reference and drops the terminal, gate and number.

**Verification:**
- [ ] `make check`, with the new integration tests (`NULL` deletes the row, flight → train keeps and drops the right columns)
- [ ] `npx vitest run lib/travel` for the payload per mode; a temporary browser test of switching and reloading

**Dependencies:** Tasks 2 and 5

**Files likely touched:** `backend/app/crud/events.py`, `backend/tests/integration/test_event_travel.py`, `lib/travel.ts` (+ test), `components/event-form.tsx`

**Estimated scope:** S/M

### Checkpoint: Phase 2
- [ ] `make check`, build, lint and `npm run check` all pass
- [ ] Flights and trains look right in the month cell, the timeline, the day sheet and the dialog, on desktop and phone
- [ ] **Review with Diego** against the prototypes

### Phase 3: Lifecycle and finish

#### Task 7: Keep travel details when a calendar is deleted and restored

**Description:** `delete_calendar` copies `travel_mode` into `deleted_events`, and the details rows into `deleted_event_travel_details`. `restore_calendar` copies both back. `crud/test.py` and the `tests/conftest.py` fixtures also clear the archive table. This follows the day names and checklist (`64de909`).

**Acceptance criteria:**
- [ ] Deleting and restoring a calendar keeps every event's travel mode and travel details exactly as they were.
- [ ] The e2e reset and user deletion leave no archived travel details behind.

**Verification:**
- [ ] `make check`, with integration tests for delete then restore, plus the cleanup paths (each confirmed to fail before its fix, as on feature 22)

**Dependencies:** Task 1 (it can run in parallel with Tasks 2–6)

**Files likely touched:** `backend/app/crud/calendars.py`, `backend/app/crud/test.py`, `backend/tests/conftest.py`, `backend/tests/integration/test_event_travel.py`

**Estimated scope:** S

#### Task 8: End-to-end spec, domain terms and final checks

**Description:** `e2e/17-travel-events.spec.ts`:
- **@17.1:** create a flight with every field → B strip on the timeline, route in the month cell, A card in the dialog; copying works
- **@17.2:** a train shows its icon and the coach and seat chips
- **@17.3:** switching a flight to None removes its details after a reload
- **@17.4:** the phone day sheet shows the strip
- **@17.5:** a public visitor sees the flight but no booking reference
- **@17.6:** the card renders in Spanish

Also add **Travel mode** and **Travel details** to `domain-terms.md`, and set the spec to `Status: implemented`.

**Acceptance criteria:**
- [ ] All six tests pass on a full run. Each one is confirmed to fail once with the code it guards broken.
- [ ] Every spec success criterion (1–10) can be ticked.

**Verification:**
- [ ] Confirm the :8000 backend is on `.env.local`
- [ ] `make check`; `npm run build && npm run lint && npm run check`
- [ ] Rebuild a throwaway database from `init.sql`

**Dependencies:** Tasks 1–7

**Files likely touched:** `frontend/e2e/17-travel-events.spec.ts`, `frontend/e2e/helpers/api.ts`, `domain-terms.md`

**Estimated scope:** M

### Checkpoint: Complete
- [ ] Every spec success criterion is met, and CI is green on the PR
- [ ] **Run `backend/migrations/add_event_travel_mode.sql` on production *before* merging.** Merging deploys the backend; the checklist release showed what happens when the tables arrive after the code.
- [ ] Ready for review and merge

## Parallelisation

- **Task 7** only needs Task 1, so it can run alongside Tasks 2–6.
- **Tasks 3, 4 and 5** each need Task 2. They touch different components, but share `lib/travel.ts` and the message files, so it's simpler to do them one after another.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Production gets the backend before the migration (it happened with the checklist) | **High** | The migration runs on production before the PR merges, as an item in the final checkpoint. The migration is additive and idempotent. |
| A calendar drag or another partial PATCH clears the travel details | High | `exclude_unset` plus an explicit test in Task 1 (API) and Task 4 (UI drag) |
| The booking reference leaks to visitors through some other read path | High | Redact in `list_events`, the only non-member read path; unit and e2e tests (Task 1, @17.5) |
| Event queries return duplicate rows or slow down | Med | The scalar subquery doesn't touch `GROUP BY`; an integration test checks events with links, expenses and travel together |
| `EventForm` (483 lines) grows hard to follow | Med | Fields in a `travel-fields.tsx` component; helpers in `lib/travel.ts` |
| Times across time zones look wrong | Low | Known limitation in the spec; no duration is shown |

## Open Questions

None. All spec questions are resolved, including one event per leg.
