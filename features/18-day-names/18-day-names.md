# 18 — Day names

GitHub issue #18: *Ability to add title to a day (eg Cardiff)*.
Prototypes: https://claude.ai/artifact/J2VJuAHeCTFMCBsSYgR6DA

## Goal

Let people give a day of their calendar a name, e.g. **"Visit to Vatican"**. A name is not an event: it labels the whole day.

## Decisions

- **One name per day per calendar.** Multi-day place ribbons are out of scope for now.
- **Max length:** 60 characters.
- **Who can edit:** owners and editors (same as events). Anyone who can view the calendar (including public read-only viewers) sees the names.
- **Deleted calendars:** day names are archived and restored with the calendar, the same way events are.

## Where names appear

- **Calendar month view:** a teal label under the date number.
  - Phones: one line, cut off with "…" when too long.
  - Larger screens: next to the date, as in the desktop prototype.
- **Day sheet (phones):** the name is the first field of the sheet, where it is edited.
- **Events page:** date dividers include the name, e.g. `SAT 7 NOV · VISIT TO VATICAN`.

## How people name a day

- **Phones:** tap a day → day sheet → type in "Add a title for this day…". Saves as you go (debounced) and when the sheet closes.
- **Larger screens:** click the marker or the name next to the date → small popover with one field; Enter saves, Esc cancels, "Remove name" clears it.

## How people discover it

Only on **unnamed days inside the trip span** (calendar start date → last event, the same range as the trip ticket):

- **Phones:** a small dashed **pencil** chip next to the date number (a hint; tapping anywhere on the day opens the day sheet).
- **Larger screens:** a faint dashed **"+ Name this day"** next to the date, which opens the popover.

No bottom tip/banner (the expenses bar and sheets already use the bottom of the screen).
