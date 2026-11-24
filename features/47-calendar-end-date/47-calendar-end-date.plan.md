# Plan: 47 — Optional end date for calendars

Issue: [#47](https://github.com/diegotrrs/kino/issues/47)

## 1. What we're building

A calendar (trip) can have an optional **end date**. It's set on the Create Calendar form, editable on Edit Calendar, and filled in automatically for Hot Trips. With it, a trip has its full length from day one, before any events exist:

- the trip pass shows the right number of days ("7 days", not "1 day");
- every day of the trip offers **"+ Name day"**;
- the calendar list shows the date range.

**Today:** calendars only store `start_date`, and the trip's length is worked out by `getTripSpan` (`frontend/lib/trip-span.ts`) as start date → last event. A new, empty calendar is therefore always one day long.

## 2. Decisions (agreed)

| Question | Decision |
|---|---|
| Picker | **Two fields.** "Start date" stays as is. A new optional **"End date"** field sits below it. Its calendar opens on the start month and greys out days before the start. Empty = today's behaviour. |
| Events after the end date | **The trip stretches.** It runs from the start date to the **later** of the end date and the last event. The end date is a minimum length, not a hard stop. |
| Editing | The same field is on **Edit Calendar**, with a way to clear it. |
| Hot Trips | **End date set automatically:** start + total itinerary days − 1. The End date field is **hidden** on the Hot Trip version of the form, since the itinerary decides it. |

## 3. Technical design

### 3.1 Database

- New migration `backend/migrations/add_end_date_to_calendars.sql`:
  ```sql
  ALTER TABLE calendars ADD COLUMN IF NOT EXISTS end_date DATE;
  ALTER TABLE calendars ADD CONSTRAINT calendars_end_after_start
      CHECK (end_date IS NULL OR end_date >= start_date);   -- guarded so it can be re-run
  ALTER TABLE deleted_calendars ADD COLUMN IF NOT EXISTS end_date DATE;
  ```
  - Nullable, no backfill: existing calendars keep working off their events.
  - The `CHECK` is the last line of defence; the API rejects bad ranges first with a clear message.
- **CI:** `init.sql` doesn't have `start_date` yet either; it comes from a migration in the list in `.github/workflows/deploy-frontend.yml`. The new migration is added to that list, **after** `add_start_date_to_calendars`.
- **Production:** you run the migration on Supabase before the backend deploy. It only adds a nullable column, so old code keeps working with it.

### 3.2 Backend

- **Schemas** (`app/schemas/calendar.py`):
  - `CalendarCreate.end_date: date | None = None`, with a validator: `end_date >= start_date` when both are given.
  - `CalendarUpdate.end_date: date | None = None`. Sending `null` clears it, which already works through `model_dump(exclude_unset=True)` in `crud.update_calendar`.
  - `CalendarResponse.end_date: date | None = None`.
- **Create:** `crud.create_calendar` inserts `end_date`. When `start_date` is missing it defaults to today, so the router also rejects an end date before today (400).
- **Update:** a PATCH may send only one of the two dates, so the router compares against the **stored** values: new start (or stored) ≤ new end (or stored). Otherwise 400 "End date can't be before the start date." This also covers moving the start date past an existing end date.
- **Archive / restore:** `delete_calendar` copies `end_date` into `deleted_calendars`, and `restore_calendar` copies it back.
- **List queries:** the two `SELECT c.id, c.uuid, … c.start_date` lists in `crud/calendars.py` (around lines 326 and 342) add `c.end_date`.

### 3.3 Trip length (frontend)

- `getTripSpan(startDate, eventDates, today, endDate?)`. The end is the latest of the start date, the end date and the event dates. That's the "trip stretches" rule, in one place.
- Callers pass the calendar's `end_date`:
  - `TripPass` (`components/calendars/trip-pass.tsx`): the day count and date range;
  - `Calendar` (`components/calendar.tsx`, `tripSpan`): the "+ Name day" markers.
- `Calendar` type (`lib/types.ts`): `end_date: string | null`.
- **Calendar list** (`calendar-list.tsx`): shows "26 Nov – 2 Dec" when there's an end date, and the start date alone otherwise.

### 3.4 Forms

- **Date picker** (`components/date-picker.tsx`): `DateTimePicker` has no "earliest date" option yet. Add optional `minDate` (days before it are greyed out and not selectable) and `defaultMonth` (the month it opens on) props, passed through to the underlying day picker.
- **Create form** (`calendar-create-form.tsx`):
  - new optional `endDate` field below Start date, labelled "End date (optional)";
  - `minDate` = start date (or today if none), opening on the start month;
  - a clear control, so a picked end date can be removed;
  - zod refinement: end ≥ start, with a translated message;
  - hidden when `tripSlug` is set (Hot Trips).
- **Edit form** (`calendar-edit-form.tsx`): the same field, pre-filled, with clear. Clearing sends `end_date: null`.
- **Server actions** (`app/(app)/calendars/actions.ts`):
  - `createCalendar(name, startDate?, endDate?)`;
  - `updateCalendar(uuid, name, startDate?, endDate?)`, where `endDate` may be `null` to clear;
  - `createTripCalendar` works out the end date from the itinerary (`sum(stop.days)`), using the existing `addDays` helper.
- **Translations** in en, es, pt and de: `createCalendar.endDate`, `endDatePlaceholder`, `endBeforeStart`, `clearEndDate`, and the same for the edit form's namespace if it uses a different one.

### 3.5 Analytics

- `calendar_created` gets `has_end_date: boolean`.
- `calendar_updated.changed` can include `'end_date'`.
- Update `lib/analytics/events.ts` and its type test. No dates are sent, only booleans and field names (rule in `frontend/CLAUDE.md` §6).

## 4. Tasks

Each task leaves the app working. Order: backend first, then what the member sees.

### Task 1: The API stores and validates an end date ✅

- **Acceptance:**
  - [ ] Migration adds `calendars.end_date` and `deleted_calendars.end_date`, plus the CHECK constraint, and can be re-run; added to the CI migration list.
  - [ ] `POST /api/calendars/` accepts an optional `end_date`; an end before the start (or before today when no start is given) returns 400.
  - [ ] `PATCH /api/calendars/{uuid}` sets, changes or clears (`null`) `end_date`; any combination that ends before the start returns 400 and changes nothing.
  - [ ] Responses include `end_date`, from both single and list endpoints.
  - [ ] Delete → restore keeps `end_date`.
- **Tests:**
  - unit tests (router validation, including "start moved past the end", asserting the crud update isn't called on rejection);
  - integration tests (`tests/integration/test_calendars.py`: create, update, clear, archive/restore round trip).
- **Verify:** `make check`.
- **Files:** `migrations/add_end_date_to_calendars.sql`, `.github/workflows/deploy-frontend.yml`, `app/schemas/calendar.py`, `app/crud/calendars.py`, `app/routers/calendars.py`, tests.

### Task 2: The trip's length uses the end date

- **Acceptance:**
  - [ ] `getTripSpan` takes the end date; the trip runs to the later of the end date and the last event.
  - [ ] The trip pass shows the full length and range for a calendar with an end date and no events.
  - [ ] Every day from start to end shows "+ Name day".
  - [ ] The calendar list shows the date range.
  - [ ] Calendars without an end date look exactly as today.
- **Tests:**
  - unit (`lib/trip-span.test.ts`: end date only; end date before the last event; no end date unchanged);
  - e2e: a calendar given an end date through the API helper shows "+ Name day" on its last day, in `15-day-names.spec.ts`.
- **Verify:** `npm run build`, `npm run lint`, `npm run check`.
- **Files:** `lib/trip-span.ts` (+ test), `lib/types.ts`, `components/calendars/trip-pass.tsx`, `components/calendar.tsx`, `app/(app)/calendars/[uuid]/page.tsx`, `components/calendars/calendar-list.tsx`, `e2e/helpers/api.ts`.

### Task 3: Pick an end date when creating a calendar

- **Acceptance:**
  - [ ] The Create Calendar form has an optional "End date" below Start date. It opens on the start month, with earlier days disabled.
  - [ ] A picked end date can be cleared.
  - [ ] Creating with both dates lands on a calendar whose trip pass shows the full length.
  - [ ] Creating without an end date behaves as today.
  - [ ] `calendar_created` includes `has_end_date`.
  - [ ] Translated in en, es, pt and de.
- **Tests:** e2e in `3-calendars.spec.ts` (create with a range → the trip pass shows "7 days"; earlier days are disabled); analytics type test.
- **Verify:** `npm run build`, `npm run lint`, `npm run check`.
- **Files:** `components/date-picker.tsx`, `components/calendars/calendar-create-form.tsx`, `app/(app)/calendars/actions.ts`, `lib/analytics/events.ts` (+ type test), `messages/*.json`, `e2e/3-calendars.spec.ts`.

### Task 4: Change or clear the end date on Edit Calendar

- **Acceptance:**
  - [ ] Edit Calendar shows the end date, pre-filled. It can be set, changed or cleared.
  - [ ] Moving the start date past the end date shows the "end before start" error and doesn't save.
  - [ ] `calendar_updated.changed` includes `'end_date'` when it changed.
- **Tests:** e2e in `3-calendars.spec.ts` (set → trip pass grows; clear → back to event-based length).
- **Verify:** `npm run build`, `npm run lint`, `npm run check`.
- **Files:** `components/calendars/calendar-edit-form.tsx`, `app/(app)/calendars/[uuid]/edit/page.tsx`, `app/(app)/calendars/actions.ts`, `messages/*.json`, e2e.

### Task 5: Hot Trips get their end date from the itinerary

- **Acceptance:**
  - [ ] A calendar created from a Hot Trip has `end_date` = start + total itinerary days − 1.
  - [ ] The End date field is hidden on the Hot Trip version of the form.
- **Tests:** e2e in `13-hot-trips.spec.ts` (the trip pass shows the itinerary's number of days).
- **Verify:** `npm run build`, `npm run lint`, `npm run check`.
- **Files:** `app/(app)/calendars/actions.ts`, `components/calendars/calendar-create-form.tsx`, `e2e/13-hot-trips.spec.ts`.

### Checkpoint

- [ ] All of the above pass, plus `make check` and the full e2e suite.
- [ ] Manual check in the browser: create "Lisbon" for 26 Nov – 2 Dec with no events, and confirm it shows "7 days" and "+ Name day" on every day.
- [ ] Production: run `add_end_date_to_calendars.sql` on Supabase **before** the backend deploy.

## 5. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Timezones shift a date by a day (`new Date('2026-11-26')` is UTC midnight) | Med | Keep dates as `yyyy-MM-dd` strings end to end, and parse with `T12:00:00` like the existing code |
| Moving the start date past the end date | Low | The API checks against stored values; the form validates both fields together; the DB `CHECK` backs it up |
| Backend deployed before the migration | Med | Run the migration first; it's additive, so the old code is unaffected |
| A very long range (e.g. a year) clutters the calendar with "+ Name day" markers | Low | Accept for V1; revisit if it comes up |

## 6. Open questions

None. All four decisions are in section 2.
