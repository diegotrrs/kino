# Spec: 23 — Flight and train events — V1

Status: implemented
GitHub issue #23: *Flight/Train event type* — "flight number, terminal, gate, seat, booking reference; rendered as a dedicated ✈ card." Extended here to trains.
Prototypes: https://claude.ai/artifact/KFrX57cqnCGEAjCSocF5Ev (V1 uses directions **A** and **B**; E is A's phone layout)

## Objective

An event can be marked as a **flight** or a **train**. That event then carries the ticket details people look for on the way: route, seat, booking reference, and for flights the flight number, terminal and gate. The details appear wherever the event appears, so nobody has to dig through emails at the airport or the station.

**Users:** members of a calendar (owners and editors) enter the details. Anyone who can see the event sees them, except the booking reference (see Decisions).

**User stories**

- As a member, when I add or edit an event I can set its travel mode to **Flight** or **Train** and fill in that ticket's fields. Ordinary events stay as they are, with travel mode **None**.
- As a member, I see a flight's or train's route and ticket details at a glance in the calendar, on the Events page and in the phone day sheet (direction **B**).
- As a member, when I open a flight or train, a boarding-pass card at the top shows everything, and I can copy the booking reference with one tap (direction **A**).
- As a member, I can change or remove an event's travel mode later. Setting it back to **None** removes its ticket details.

## Decisions

| Topic | Decision |
|---|---|
| Marking flights and trains | New nullable column `events.travel_mode`: `NULL` (an ordinary event) \| `'flight'` \| `'train'`, with a `CHECK` constraint. There's no name for "ordinary": every row is an Event, and being a flight or a train is an extra property of some. Existing events stay `NULL` and need no backfill. |
| Storing the details | A 1:1 table `event_travel_details`, holding one row exactly when `travel_mode` is set. Its columns are typed and nullable, because people often don't know the gate or seat when they book. |
| Fields per mode | **Flight:** origin, destination, flight number, terminal, gate, seat, booking reference. **Train:** origin, destination, coach, seat, booking reference. Columns that don't apply to the mode are rejected (`422`), not stored. |
| Route | `origin` and `destination` are free text (`LHR`, `London St Pancras`). There's no airport or station lookup, so V1 shows no airline names, flight durations or live status. |
| Title | For flights and trains the title is **suggested from the ticket** and may be left empty: **"Flight to {destination}"** → **"Flight {number}"** → **"Flight"**, and **"Train to {destination}"** → **"Train"**, in the member's language. While the member hasn't typed a title of their own, the suggestion fills the field and follows the route; an empty field saves the suggestion; a typed title is kept. Ordinary events still need a title. Frontend only: every saved event still has a real `title`. |
| Times | Departure and arrival are the event's existing start and end, so nothing is stored twice. Each is the **local time** where it happens; there's no time-zone conversion (see Known limitations). |
| Lengths | `number`, `terminal`, `gate`, `coach`, `seat`: ≤ 10 characters. `booking_reference`: ≤ 20. `origin`, `destination`: ≤ 60. HTML is stripped and whitespace trimmed; empty strings are stored as `NULL`. |
| Booking reference privacy | With a surname, a booking reference is enough to manage or cancel a real booking. So the API returns `booking_reference` **only to members**. Visitors to a public calendar see the route, times, number, terminal, gate, coach and seat, but not the reference. |
| Changing the travel mode | Setting `travel_mode` to `NULL` deletes the details row. Changing between flight and train keeps the shared fields (route, seat, reference) and clears the ones that don't apply. |
| Deleted calendars | Details are archived with the calendar (`deleted_event_travel_details`) and restored with it, the same way day names and checklist items are. `deleted_events` gains `travel_mode`. |
| Schema in CI | The new column and table go in **both** `backend/migrations/add_event_travel_mode.sql` (for existing databases, including production) **and** `backend/init.sql` (which CI and fresh databases are built from). |
| Domain terms | Add **Travel mode** (`flight` \| `train`; none means an ordinary event) and **Travel details** to `domain-terms.md`. Code uses `travelMode` / `travel_mode` and `travel`, never `type` or `kind`. |

## Where it appears

**Direction B: event row + ticket strip** (everywhere events are listed)

- **Calendar month cell** (`EventItem` in `components/calendar.tsx`): a plane or train icon, the start time and the **route instead of the title**, e.g. `✈ 07:15 LHR→FCO`. Without a route it falls back to the title.
- **Events page timeline** (`components/events/event-timeline-client.tsx`): the existing row with an icon, the title, `LHR → FCO`, and a wrapping strip of mono chips. Only chips with a value are shown.
  - Flight: `BA 2490` · `TERM 5` · `GATE B32` · `SEAT 14A` · `REF K7XQ2M`
  - Train: `COACH 7` · `SEAT 61` · `REF Q4PL9X`
- **Phone day sheet** rows (`components/calendars/day-sheet.tsx`): the same strip, wrapping onto two lines at 390px.
- The `REF` chip is a button that copies the reference and briefly shows "Copied". It only appears for members.

**Direction A: boarding-pass card** (top of the event dialog, `components/event-form.tsx`, in edit and read-only modes)

- **Desktop / `sm`+ (prototype A):** big origin and destination with a dashed line between, then departs / terminal / gate (train: departs / coach), and a perforated stub with the **seat** and **booking reference** plus a Copy button.
- **Phones (prototype E's layout):** the same card stacked vertically, with the stub at the bottom and a full-width, 44px "Copy booking reference" button.
- Fields with no value are left out. If nothing beyond the route is filled in, the card is a slim route header.
- The accent colour is the event's colour, as on the prototypes' Tweaks.

**Entering the details** (`EventForm`, add and edit modes)

- For flights and trains the title is optional and suggested from the ticket (see Decisions › Title).

- A **Travel** row under the title: **None · Flight · Train**, as a segmented control with None selected by default, so ordinary events look as they do today. Choosing Flight or Train shows that mode's fields. Choosing None hides them; if fields were filled in, saving clears them.
- Field labels and placeholders are translated in all four locales. Labels for screen readers come from the visible labels.

## API (backend)

Existing endpoints change shape; there are no new routes.

- `EventCreate` / `EventUpdate` gain `travel_mode: 'flight' | 'train' | None` and `travel: TravelDetailsIn | None`.
  - `travel` given without a `travel_mode` → `422`.
  - A field that doesn't apply to the mode (e.g. `gate` on a train, `coach` on a flight) → `422`.
  - `EventUpdate` follows the existing `exclude_unset` PATCH behaviour. `travel` sent → the details row is replaced. `travel_mode` set to `null` → the row is deleted.
- `EventResponse` gains:
  - `travel_mode`
  - `travel: TravelDetailsOut | None`, with `booking_reference` set to `null` unless the caller is a member.
- The event list queries (`get_event`, `get_events`, `get_events_by_calendar`) `LEFT JOIN event_travel_details`, like `event_links` and `event_expenses`.
- Permissions are unchanged: only members can create or update; visibility follows the event's calendar.

**Migration** `backend/migrations/add_event_travel_mode.sql`, also added to `backend/init.sql`:

```sql
-- NULL = an ordinary event
ALTER TABLE events         ADD COLUMN IF NOT EXISTS travel_mode VARCHAR(10);
ALTER TABLE events         ADD CONSTRAINT events_travel_mode_check CHECK (travel_mode IN ('flight', 'train'));
ALTER TABLE deleted_events ADD COLUMN IF NOT EXISTS travel_mode VARCHAR(10);

-- One row per flight/train event
CREATE TABLE IF NOT EXISTS event_travel_details (
    event_id          INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
    origin            VARCHAR(60),
    destination       VARCHAR(60),
    number            VARCHAR(10),   -- flight number (flights only)
    terminal          VARCHAR(10),   -- flights only
    gate              VARCHAR(10),   -- flights only
    coach             VARCHAR(10),   -- trains only
    seat              VARCHAR(10),
    booking_reference VARCHAR(20),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ
);
-- plus deleted_event_travel_details (same columns + deleted_at) and RLS on both, as for day names
```

## Tech Stack

Unchanged. The FastAPI, psycopg2 raw SQL and Pydantic backend; the Next.js 15, Tailwind, shadcn/ui and next-intl frontend. Icons come from `lucide-react` (`Plane`, `TrainFront`), which is already a dependency. **No new dependencies.**

## Commands

```bash
# Backend (from backend/, with .venv active)
make check

# Frontend (from frontend/)
npm run build
npm run lint
npm run check
```

Before e2e, confirm the :8000 backend isn't running with `.env.prod`. After writing the migration, build a throwaway database from `init.sql` the same way CI does.

## Project Structure

```
backend/
  migrations/add_event_travel_mode.sql               # new
  init.sql                                           # + travel_mode, event_travel_details, archive mirror
  app/schemas/event.py                               # travel_mode, TravelDetailsIn/Out, per-mode validation
  app/crud/events.py                                 # join, upsert/delete details, member-only reference
  app/crud/calendars.py                              # archive + restore travel details
  app/crud/test.py                                   # clean archived travel details
  app/routers/events.py                              # pass membership through for the reference
  tests/unit/test_event_travel.py                    # new: validation, mode switching, reference hiding
  tests/integration/test_event_travel.py             # new: SQL, joins, cascade, archive/restore
frontend/
  lib/types.ts                                       # TravelMode, TravelDetails
  lib/travel.ts (+ .test.ts, .test.data.ts)          # chip list, route label, fields per mode
  components/events/travel-strip.tsx                 # new: direction B chips (+ copy reference)
  components/events/travel-card.tsx                  # new: direction A boarding pass (desktop + phone)
  components/event-form.tsx                          # Travel row, fields, card at the top
  components/calendar.tsx                            # EventItem: icon + route
  components/events/event-timeline-client.tsx        # strip in timeline rows
  components/calendars/day-sheet.tsx                 # strip in day sheet rows
  app/(app)/calendars/[uuid]/page.tsx, utils/data.ts # carry travelMode + travel into CalendarEvent
  messages/{en,es,pt,de}.json                        # `travel` namespace
  e2e/17-travel-events.spec.ts                       # new
domain-terms.md                                      # Travel mode, Travel details
```

## Code Style

Follow `frontend/docs/coding-standards.md` and `backend/docs/coding-standards.md`, taking the review findings on feature 22 into account:
- Use curly braces on every `if`.
- Annotate return types, including components.
- Name booleans `is`/`has`/`can`.
- Put validation in schemas only where the standards allow it.

```python
TravelMode = Literal["flight", "train"]


class TravelDetailsIn(BaseModel):
    origin: str | None = Field(None, max_length=60)
    destination: str | None = Field(None, max_length=60)
    number: str | None = Field(None, max_length=10)       # flights only
    terminal: str | None = Field(None, max_length=10)     # flights only
    gate: str | None = Field(None, max_length=10)         # flights only
    coach: str | None = Field(None, max_length=10)        # trains only
    seat: str | None = Field(None, max_length=10)
    booking_reference: str | None = Field(None, max_length=20)
```

```ts
export type TravelMode = 'flight' | 'train';

export const FIELDS_BY_TRAVEL_MODE = {
  flight: ['number', 'terminal', 'gate', 'seat', 'booking_reference'],
  train: ['coach', 'seat', 'booking_reference'],
} as const;
```

## Testing Strategy

- **Backend unit:**
  - per-mode validation (fields that don't apply → `422`; `travel` without a `travel_mode` → `422`)
  - HTML stripping and empty strings becoming `NULL`
  - `booking_reference` hidden for non-members and anonymous users, shown to owners and editors
  - on every refused write, assert that no crud write was made
- **Backend integration:**
  - create, read and update round trips for flights and trains
  - setting `travel_mode` to `NULL` deletes the details row
  - flight ↔ train keeps the shared fields and clears the others
  - deleting the event cascades
  - deleting and restoring the calendar keeps the details
  - list queries return `travel` without duplicating rows next to links and expenses
  - existing events come back with `travel_mode: null` and no `travel`
- **Frontend unit (vitest):**
  - chips per mode, with empty values dropped
  - the route label, falling back to the title
  - fields per mode
- **E2E** (`e2e/17-travel-events.spec.ts`):
  - create a flight with all fields; the B strip appears in the timeline, the route shows in the month cell, and the A card appears in the dialog; copying the reference works
  - create a train; it shows a train icon and the coach and seat chips
  - set a flight back to None; the details are gone after a reload
  - the phone day sheet shows the strip
  - a public visitor sees the flight but **not** the booking reference
  - the card renders in Spanish
- **Proving tests can fail:** for each new e2e and integration test, break the code it guards once and confirm the test fails, as on feature 22.

## Boundaries

- **Always:**
  - add schema changes to both the migration and `init.sql`
  - check membership before revealing a booking reference
  - strip HTML from free text
  - translate every string in all four locales
  - run `make check` and `npm run build && npm run lint && npm run check`
- **Ask first:**
  - adding any dependency (none are expected)
  - running the migration on production
  - changing how ordinary events look
  - any airport, airline or station lookup service
- **Never:**
  - expose `booking_reference` to non-members
  - store the times twice
  - run e2e against a backend using `.env.prod`

## Success Criteria

1. A member can create, edit and delete flight and train events with every field from Decisions, and the details persist across reloads.
2. Existing events are unaffected after the migration: `travel_mode` is `NULL`, there are no details, and they look the same as before.
3. **B:** flights and trains show the icon, route and chip strip on the Events timeline and in the phone day sheet, and the icon, time and route (instead of the title) in the month cell. Only chips with values appear, and the strip wraps at 390px without overflowing.
4. **A:** opening a flight or train shows the boarding-pass card on desktop and the stacked card on phones. The Copy button copies the booking reference.
5. Changing the travel mode works as described in Decisions (deleting or clearing fields).
6. A public visitor to a public calendar sees the flight or train but never its booking reference, in the UI or the API response.
7. Deleting and restoring a calendar keeps every event's travel mode and travel details.
8. A fresh database built from `init.sql` (as CI does) has the new schema, and CI's e2e job passes.
9. All new strings are translated in en, es, pt and de.
11. A member can save a flight or train without typing a title. It gets the suggested title, which follows the route while untouched; a title they typed is never overwritten.
10. `make check`, `npm run build`, `npm run lint` and `npm run check` all pass.

## Known limitations

- **Time zones:** times are entered as local times at each end (departs 07:15 London, arrives 10:45 Rome). The calendar stores them without a time zone, so a flight that crosses zones shows correct local times but its apparent length is wrong. No duration is shown, so this doesn't surface in V1.

## Out of Scope (Deferred)

- **Train number and platform:** not asked for. The platform is usually only known on the day.
- **Airline and airport lookups:** airline names, airport and station names from codes, and flight duration all need a lookup table or service.
- **Live flight status:** check-in closing, delays and gate changes need a flight-data API.
- **Other travel modes:** bus, ferry, car hire. Adding one is a `CHECK` change plus its fields.
- **Multi-leg journeys:** connections are entered as **one event per leg**, each with its own times and ticket details. A service with intermediate stops you stay on board for is a single event. Linking legs into a journey (e.g. a nullable `events.journey_id`, showing "Leg 1 of 2 · 1h 05m connection" and entering the booking reference once) is a later, purely additive change.
- **An "Add flight" / "Add train" shortcut** that opens the form with the travel mode already chosen.
- **Booking emails turning into events (#25):** that issue's extraction would fill in `travel_mode` and `travel`. This schema is designed for it, but V1 builds no import.
- **Directions C (departure board) and D (route card in the right-hand column).**
- **Hiding other fields from public visitors:** seat and the other fields stay visible; only the reference is hidden.

## Resolved Questions

1. **Booking reference privacy:** hidden from non-members, including visitors to public calendars. The seat and other fields stay visible.
2. **Where the travel mode is chosen:** in the event form, as a **None · Flight · Train** row. A shortcut that opens the form already set to a mode is deferred.
3. **Month cell:** shows the **route instead of the title**, falling back to the title when there's no route.
4. **Naming the default:** there's no "event" kind. `travel_mode` is `NULL` for ordinary events and only names `flight` or `train`.
5. **Title of a flight or train:** optional and suggested from the ticket rather than stored as empty (frontend only, no schema change).
