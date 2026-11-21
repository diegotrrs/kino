# Spec Delta: 39 — Stays and booking references on every event

Status: approved
GitHub issue #39: *Hotel/Hostal event type*.
Changes: feature 23, *Flight and train events* (`features/23-flight-train-events/23-flight-train-events.md`, implemented). Everything not mentioned here is inherited from it unchanged.

## Objective

1. **Any event can have a booking reference**, not just flights and trains. A museum ticket, a restaurant table or a tour all have one, and people want it to hand.
2. **Any event can have an address.** Tapping it opens Google Maps.
3. **A new kind of event, the Stay**, covers anywhere you sleep: hotel, hostel, Airbnb, guesthouse, campsite. A stay has a bed icon and is shown like a flight: an icon in the month cell, a REF chip in lists, and a card in the dialog with check-in → check-out, the address and the booking reference.

**User stories**
- As a member, I can add a booking reference to any event and copy it from the event's row or dialog.
- As a member, I can give any event an address, and anyone who can see the event can tap it to open Google Maps.
- As a member, I can set an event's travel mode to **Stay**, enter its booking reference, and see check-in and check-out at a glance.

## Current Behavior (feature 23)

- **Travel mode:** `events.travel_mode` is `NULL` (an ordinary event), `'flight'` or `'train'`.
- **Booking reference:** stored in `event_travel_details.booking_reference`, so only flights and trains can have one. It's hidden from non-members.
- **Event form:** the Travel row is None · Flight · Train. The booking reference is one of the flight and train fields. The form has **no location field**, even though `events.location` exists.
- **REF chip and card:** only flights and trains get the ticket strip (with REF) and the boarding-pass card.

## New Behavior

### Decisions

| Topic | Decision |
|---|---|
| Domain term | **Stay**: any place you sleep (hotel, hostel, Airbnb, guesthouse, campsite). Translated as *Alojamiento* (es), *Alojamento* (pt), *Unterkunft* (de). Add to `domain-terms.md`; don't use "hotel" as the general term. |
| Marking a stay | `travel_mode = 'stay'`. The `CHECK` becomes `IN ('flight', 'train', 'stay')`. A stay has **no** `event_travel_details` row: a row exists only for flights and trains. |
| Booking reference | Moves to **`events.booking_reference`** (`VARCHAR(20)`, nullable), for **every** event. HTML is stripped and blanks become `NULL`. It's **removed** from `event_travel_details` and from the API's `travel` object. |
| Privacy | Unchanged rule, now applied to every event: `booking_reference` is returned only to members, and is `null` for visitors to public calendars. |
| Address | Stored in the existing **`events.location`** column (≤ 255 characters, HTML stripped, blanks become `NULL`). The form shows an **Address** field for **every** event. It's visible to anyone who can see the event, as `location` already is; no new privacy rule. |
| Opening maps | Wherever an address is shown, it's a link to `https://www.google.com/maps/search/?api=1&query=<address, URL-encoded>`, opened in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). Built by one tested helper. Nothing is sent to Google until the person taps. |
| Stay's dates | Check-in and check-out are the event's start and end, so nothing is stored twice. **No number of nights** is stored or shown. |
| Stay's title | Suggested the same way as flights and trains: **"Stay"** (es *Alojamiento*, pt *Alojamento*, de *Unterkunft*) while untouched. People will usually type the hotel's name. |
| Icon | `BedDouble` from lucide (already a dependency). |

### Where it appears

- **Event form:**
  - The Travel row becomes **None · Flight · Train · Stay**.
  - Two fields are **always visible** for every event (the address sits just under When; the booking reference just above Links):
    - **Address** (≤ 255 characters), with a small map button next to it that opens the address in Google Maps;
    - **Booking reference** (≤ 20 characters, monospace). It moves out of the flight and train fields, so flights and trains use it too.
  - Read-only visitors see the address as a link and no booking reference.
- **Month cell:** stays show the bed icon and the title; flights and trains are unchanged.
- **Events timeline and phone day sheet:**
  - The address the timeline already shows (with a pin icon) becomes a **Google Maps link**, and the day sheet shows it too.
  - Like the REF chip, the link sits above the row's open-event layer: tapping it opens the map, not the event.
  - The strip now appears for **any** event with a booking reference.
  - **Ordinary events** show just the REF chip.
  - **Stays** show the bed icon and the REF chip.
  - **Flights and trains** are unchanged, but their REF now comes from the event.
- **Event dialog:**
  - **Flights and trains:** the boarding pass is unchanged.
  - **Stays:** a **stay card**.
    - Header: the bed icon and "Stay".
    - **Check-in** → **Check-out**, each a large date with its time underneath (e.g. `SAT 7 NOV · 15:00` → `MON 9 NOV · 11:00`).
    - The address, as a Google Maps link.
    - A stub with the booking reference and Copy.

    Fields with no value are left out. Phone layout: stacked, with a full-width 44px copy button, as for flights.
  - **Ordinary events with a reference:** no card; the reference is in the form field, with a Copy button next to it.

### API (backend)

- **`EventCreate` / `EventUpdate`:**
  - gain top-level `booking_reference: str | None` (≤ 20);
  - `location` (which already exists) gains the same cleaning: HTML stripped, blanks become `NULL`, ≤ 255;
  - `travel_mode` accepts `'stay'`;
  - `travel` given with `'stay'` → `422`, since stays have no travel fields;
  - `booking_reference` inside `travel` → `422`.
- **`EventResponse`:** gains top-level `booking_reference`, which is `null` for non-members on every event. `travel` no longer contains it.
- **Changing to or from Stay:** the existing mode-change rules apply. Changing to Stay deletes any travel-details row; changing from Stay to a flight creates an empty one. The booking reference and the location are **kept** across mode changes, because they're on the event.
- **Calendar delete and restore:** `deleted_events` gains `booking_reference`. The travel-details archive loses it.

### Migration: two steps, so the running app never breaks

The live backend reads `event_travel_details.booking_reference`, so it can't be dropped at the same moment the new code ships.

1. **`backend/migrations/add_event_booking_reference_and_stays.sql`:** run on production **before merging**.
   - Adds `events.booking_reference` and `deleted_events.booking_reference`.
   - Copies existing references across: `UPDATE events … FROM event_travel_details`, and the same for the archive.
   - Widens the `CHECK` to allow `'stay'`.

   It only adds things, and it can be re-run safely.
2. **`backend/migrations/drop_travel_booking_reference.sql`:** run **after** the new backend is deployed and checked.
   - Copies across, once more, any reference written in the gap (`WHERE events.booking_reference IS NULL`).
   - Then drops `booking_reference` from `event_travel_details` and `deleted_event_travel_details`.

`backend/init.sql` gets the **final** shape (the column on `events`, none in the travel tables, `'stay'` in the `CHECK`), because CI builds its database from it.

## Success Criteria

1. Any event (ordinary, flight, train or stay) can be saved with a booking reference. It persists, shows as a copyable REF chip in the timeline and day sheet, and is never sent to non-members.
2. A member can create a stay with an address and a booking reference. The month cell shows the bed icon; the timeline and day sheet show the icon, the address and REF; and the dialog shows the stay card with check-in, check-out, the address and Copy. No number of nights appears anywhere.
3. Existing flight and train references survive the migration unchanged and still show everywhere they did, including the boarding pass.
4. Switching an event between Stay, Flight, Train and None keeps its booking reference and location, and applies feature 23's rules to the travel fields.
5. Deleting and restoring a calendar keeps every event's booking reference and travel mode.
6. Step 1 of the migration can run while the old backend is live without breaking it. After both steps and the deploy, the schema matches `init.sql`.
7. Every new string is translated (en, es, pt, de), and English text that already exists is unchanged.
8. `make check`, `npm run build`, `npm run lint` and `npm run check` pass. New e2e tests cover a stay, a reference on an ordinary event, and visitors not getting references. Each is checked to fail with the code it guards broken.
9. Any event can be given an address in the form. Wherever the address is shown (form, timeline, day sheet, stay card, a visitor's read-only dialog), tapping it opens Google Maps for that address in a new tab, without also opening the event.

## Testing Strategy (delta)

- **Backend unit:**
  - `booking_reference` and `location` validation (HTML, blanks, length) on any event;
  - `'stay'` refused with travel fields;
  - `booking_reference` refused inside `travel`;
  - references removed for non-members on ordinary events too.
- **Backend integration:**
  - create, read and update round trips with a reference on an ordinary event and on a stay;
  - mode changes keep the reference and location;
  - archive and restore keep the reference.
- **Migration check:**
  - apply step 1 to a copy of the local database that has flight and train references;
  - check every reference was copied and the old backend's queries still work;
  - apply step 2 and check the result matches `init.sql`.
- **Frontend unit:** the Google Maps link builder (encoding, empty address), the stay's strip, and the suggested title for a stay.
- **E2E** (`e2e/18-stays-and-booking-references.spec.ts`):
  - create a stay with an address and a reference, and see the month cell, the strip and the card with Copy;
  - add an address and a reference to an ordinary event, and see its REF chip and a map link pointing at the encoded address;
  - a visitor sees neither reference;
  - the stay card in Spanish.

## Boundaries (delta)

- **Always:**
  - run migration step 1 on production **before** merging, and step 2 only **after** the deploy is checked;
  - keep feature 23's rule that booking references are members-only, now for every event.
- **Ask first:** dropping the old column (step 2) on production.
- **Never:** drop `event_travel_details.booking_reference` in the same release as the code that stops reading it.

## Out of Scope (Deferred)

- **More stay details:** room number, guests, separate check-in and check-out time windows. Start and end times cover the basics.
- **Directions, embedded maps, or a choice of map app** (Apple Maps and so on): V1 only links to a Google Maps search.
- **A number of nights:** not stored or shown.
- **Renaming `travel_mode`** to something broader: "stay" reads fine as a travel mode.
- **Booking emails turning into stays and references (#25):** the schema now suits it, but it isn't built here.

## Resolved Questions

1. **Address:** every event gets an Address field (the existing `location` column). Tapping the address anywhere opens Google Maps.
2. **Nights:** not included, neither in the database nor in the UI.
