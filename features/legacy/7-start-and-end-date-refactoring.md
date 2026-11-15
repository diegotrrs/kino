# Feature 7 — Start and End Date Refactoring

## 1. Description

Currently both the Add Event and Edit Event forms display two stacked `DateTimePicker` fields ("Start" and "End"). Each combines a date picker and time picker inside a single popover. This is visually heavy for the common case (single-day events), wastes form space, and makes the distinction between a 3-hour event and a multi-day event unclear.

This feature replaces the two stacked pickers with a compact, intent-driven layout that matches how Google Calendar and Apple Calendar handle date/time entry:

- **Single-day (default):** one shared date picker + "Start time" and "End time" side by side
- **Multi-day (opt-in via toggle):** separate start and end date pickers, each paired with a time picker

## 2. Technical Specification

### 2.1 Frontend

#### New component — `frontend/components/events/event-date-range-picker.tsx`

A `'use client'` component that encapsulates all date/time selection logic. Shared by both the add and edit event forms.

**Props:**
```typescript
type Props = {
  start: Date | undefined;
  end: Date | undefined;
  onChange: (start: Date, end: Date) => void;
  disabled?: boolean;
};
```

Returns `null` when `start` or `end` is undefined (handles brief window before form initialises).

**Internal state:**
- `isMultiDay: boolean` — initialised from `start.toDateString() !== end.toDateString()`
- A `useEffect` re-syncs `isMultiDay` when props change (e.g. a different event is opened in the edit form)

**Internal utility:**
- `setDatePart(target: Date, source: Date): Date` — copies year/month/day from `source` into `target`, preserving `target`'s time

**Building blocks from `./date-picker` (already exported):**
- `DateTimePicker` with `granularity='day'` and `displayFormat={{ hour24: 'PP', hour12: 'PP' }}` — date-only picker (time section hidden by granularity; display format shows date only)
- `TimePicker` with `hourCycle={12}` and `granularity='minute'` — inline time inputs (hour, minute, AM/PM)

**Single-day layout:**
```
Date       [ Apr 29, 2026                              ]
Start time [ 🕐 10 : 00 AM ]   End time [ 🕐 01 : 00 PM ]
[ Switch ] Spans multiple days
```

**Multi-day layout:**
```
Start  [ Apr 29, 2026 ]  [ 🕐 10 : 00 AM ]
End    [ May 02, 2026 ]  [ 🕐 01 : 00 PM ]
[ Switch (on) ] Spans multiple days
```

**Toggle behaviour:**
- `false → true`: reveals end date picker; no date change
- `true → false`: snaps end date to start date (preserving end time); hides end date picker

**Shared-date change (single-day):** updates both start and end to the new date; preserves their respective times using `setDatePart`.

#### Updated `event-add-form.tsx`

Remove the two `FormField`/`DateTimePicker` blocks. Replace with:

```tsx
const startValue = form.watch('start');
const endValue = form.watch('end');

<EventDateRangePicker
  start={startValue}
  end={endValue}
  onChange={(newStart, newEnd) => {
    form.setValue('start', newStart, { shouldValidate: true });
    form.setValue('end', newEnd, { shouldValidate: true });
  }}
/>
```

Zod schema for `start` and `end` is unchanged.

#### Updated `event-edit-form.tsx`

Same replacement as above. Add `key={event?.id}` on `EventDateRangePicker` to force remount when a different event is opened (resets `isMultiDay` state and the `TimePicker`'s internal AM/PM state). Pass `disabled={readOnly}`.

### 2.2 Backend

No changes. The API payload format (`date`, `start_time`, `end_date`, `end_time`) is unchanged. For single-day events, `end_date` is sent as the same value as `date` (preserving existing behaviour).

### 2.3 Database

No changes. `date`, `start_time`, `end_date` (nullable), `end_time` already exist.

## 3. Other

- No E2E test changes needed — existing tests create events via the API, not through the date picker UI.
- Labels ("Date", "Start time", "End time", "Spans multiple days") are hardcoded English, consistent with the existing form fields (Title, Description, Color, etc.) which are not yet i18n'd.
- `TimePicker` renders inline inputs (not in a popover). It is wrapped in a `border border-input` div to visually match the date picker button.
- `key={event?.id}` on `EventDateRangePicker` in the edit form is necessary because `TimePicker` initialises its AM/PM state from props once on mount and does not re-sync — remounting on event change prevents stale AM/PM display.
