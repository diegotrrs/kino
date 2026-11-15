# 18 — Day names: implementation plan

Feature: `18-day-names.md`

## 1. Database

New migration `backend/migrations/add_calendar_day_names.sql`, and the same in `init.sql`:

```sql
CREATE TABLE IF NOT EXISTS calendar_day_names (
    calendar_id INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    name        VARCHAR(60) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    PRIMARY KEY (calendar_id, date)
);

-- Mirrors deleted_events: archived when a calendar is deleted, copied back on restore
CREATE TABLE IF NOT EXISTS deleted_calendar_day_names (
    calendar_id INTEGER NOT NULL,
    date        DATE NOT NULL,
    name        VARCHAR(60) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (calendar_id, date)
);

-- Supabase exposes public tables through its Data API; Kino's backend bypasses RLS
ALTER TABLE calendar_day_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_calendar_day_names ENABLE ROW LEVEL SECURITY;
```

The RLS lines also run fine on local Postgres and in CI.

## 2. Backend

- **`app/schemas/day_name.py`:**
  - `DayNameSet {name}`: stripped, HTML tags removed, 1–60 characters.
  - `DayNameResponse {date, name}`.
- **`app/crud/day_names.py`:**
  - `get_day_names(db, calendar_id)`
  - `set_day_name(db, calendar_id, date, name)`: an upsert, `INSERT … ON CONFLICT (calendar_id, date) DO UPDATE`.
  - `delete_day_name(db, calendar_id, date) -> bool`
- **`app/crud/calendars.py`:** `delete_calendar` archives into `deleted_calendar_day_names`, and `restore_calendar` copies them back and clears the archive. This is the same pattern as events.
- **Routes in `app/routers/calendars.py`,** with the same permissions as calendar expenses:
  - `GET /api/calendars/{calendar_uuid}/day-names`: public calendars, or members.
  - `PUT /api/calendars/{calendar_uuid}/day-names/{date}`: members (owners and editors). Body: `{name}`. Returns 200 with `DayNameResponse`.
  - `DELETE /api/calendars/{calendar_uuid}/day-names/{date}`: members. Returns 204, or 404 if there was no name.
- **`app/crud/test.py`:** the e2e reset also deletes the test user's day names.
- **Tests:**
  - Unit tests on the router: the permission matrix, and that the crud call is never made when access is refused.
  - Schema validation tests: empty, too long, HTML stripped.
  - Integration tests: the upsert, cascade on calendar delete, and archive and restore.

## 3. Frontend

- **`lib/types.ts`:** `DayName {date, name}`.
- **Server actions** (`app/(app)/calendars/actions.ts`): `setDayName(uuid, date, name)` and `removeDayName(uuid, date)`.
- **Calendar page:** fetch the day names alongside events and expenses, and pass them into `EventsProvider` as `serverDayNames`. The context gets `dayNames`, `setDayNameLocal` and `removeDayNameLocal`, applied optimistically.
- **`lib/trip-span.ts`:** reuse `getTripSpan` to decide which days get the marker.
- **`components/calendar.tsx` `DayRender`:**
  - **Named day:** a teal name. On phones it's a line under the number, cut off with "…"; from `md` up it sits next to the number.
  - **Unnamed day inside the trip span, phones:** the dashed pencil chip next to the number. It's only a hint; tapping the day opens the day sheet.
  - **Unnamed day inside the trip span, `md` and up:** a dashed "+ Name this day" button that opens the naming popover.
  - **Read-only viewers:** see names, but no markers.
- **New `components/calendars/day-name-popover.tsx`:**
  - Desktop popover with one input, max 60 characters.
  - Enter saves, Esc cancels, and "Remove name" clears the name.
- **`components/calendars/day-sheet.tsx`:**
  - The name input is the first line, read-only for viewers.
  - It saves 600ms after you stop typing and when the sheet closes. Clearing it removes the name.
- **Events page (`event-timeline-client.tsx`):** date dividers show `SAT 7 NOV · VISIT TO VATICAN`. The Events page fetches the day names for each calendar its events come from.
- **Translations:** a `dayNames` group in en, es, pt and de: placeholder, "Name this day", "Remove name", the label for the edit icon.
- **Unit tests:**
  - a helper that decides whether a day shows a marker (trip span and no name);
  - formatting the Events page divider with and without a name.
- **E2E tests:**
  - **Desktop:** click "+ Name this day", type, press Enter. The name appears, and is still there after a reload.
  - **Phone viewport:** open the day sheet, type a name, close the sheet. The name appears in the calendar cell.
  - **Desktop:** remove the name. The marker comes back.

## 4. Supabase

Run the migration's SQL once in the Supabase SQL Editor, **before** deploying the backend. New endpoints that query a missing table would return 500.

## 5. Checks

- Frontend: `npm run build`, `npm run lint`, `npm run check`.
- Backend: `make check`.
