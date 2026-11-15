# Plan: Share Calendar (Feature 9-4)

## Overview

Allow users to make calendars public and share them via a link. Public calendars are viewable (read-only) by anyone without login. Private calendars show a lock overlay to unauthenticated visitors.

---

## 1. Database

**File:** `backend/init.sql`

- Add `is_public BOOLEAN NOT NULL DEFAULT FALSE` column to the `calendars` table.
- Update seed data so all seed calendars default to `is_public = FALSE`.

---

## 2. Backend

### 2.1 Schema — `backend/app/schemas/calendar.py`

- Add `is_public: bool` to `CalendarResponse`.
- Add `is_public: bool | None` to `CalendarUpdate`.

### 2.2 CRUD — `backend/app/crud/calendars.py`

- `get_calendar(calendar_uuid, user_id=None)`:
  - Include `is_public` in the SELECT.
  - No change to access logic here — enforcement stays in the router.

- `update_calendar(calendar_id, data)`:
  - Handle the optional `is_public` field if present in the payload.

### 2.3 Router — `backend/app/routers/calendars.py`

- **GET `/{calendar_id}`** — remove the hard auth requirement so anonymous access is possible:
  - If a valid session token is present, resolve `current_user` as usual.
  - If no token (anonymous), set `current_user = None`.
  - Call `crud.get_calendar(uuid, user_id=current_user.id if current_user else None)`.
  - If the calendar is **public**: return it regardless of membership.
  - If the calendar is **private** and the user is not a member: raise `403`.
  - Include `is_public` in the response.

- **PATCH `/{calendar_id}`** — extend to accept `is_public`:
  - No change to authorization (owner-only).
  - Pass `is_public` through to `crud.update_calendar()` if provided.

### 2.4 Migration

Create a migration script `backend/migrations/add_is_public_to_calendars.sql`:

```sql
ALTER TABLE calendars ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## 3. Frontend

### 3.1 Types — `frontend/lib/types.ts`

- Add `is_public: boolean` to the `Calendar` interface.

### 3.2 Server Actions — `frontend/app/(app)/calendars/actions.ts`

- Update `updateCalendar(id, name)` → `updateCalendar(id, name, isPublic?)` to support sending `is_public`.
- Or add a dedicated `updateCalendarVisibility(id, isPublic)` action.

### 3.3 Edit Calendar Page — `frontend/app/(app)/calendars/[id]/edit/page.tsx` + `CalendarEditForm`

In `CalendarEditForm` (`frontend/components/calendars/calendar-edit-form.tsx`):

- Add a **Visibility** section below the Name field.
- Toggle (Switch component) labelled "Make this calendar public".
- On toggle, call `updateCalendarVisibility(calendarId, newValue)`.
- Show current value from the `calendar` prop.

### 3.4 Share Dialog — new component `frontend/components/calendars/calendar-share-dialog.tsx`

A modal dialog triggered by a "Share" button. Behaviour:

- **If calendar is private:** Show a toggle at the top — "Make public to share". Options (WhatsApp, Facebook Messenger, Email, Copy link) are **disabled** until public.
- **If calendar is public:** Show sharing options directly:
  - **WhatsApp** — opens `https://wa.me/?text=<encoded url>` in a new tab.
  - **Facebook Messenger** — opens the FB send dialog URL in a new tab.
  - **Email** — opens `mailto:?subject=<calendar name>&body=<encoded url>` in the default mail client.
  - **Copy link** — copies `window.location.origin/calendars/<uuid>` to clipboard; shows an inline alert/toast: "Now paste the url in an app".
- The toggle to make public/private is also available inside this dialog (calls `updateCalendarVisibility`).

### 3.5 Calendar Page — `frontend/app/(app)/calendars/[id]/page.tsx`

- Add a **Share button** (icon: Share2 from lucide-react) next to the edit (pencil) button — **visible only to the owner**.
- Clicking it opens `CalendarShareDialog`.

### 3.6 My Calendars Page & CalendarList — three-dots menu

In `CalendarDeleteButton` (`frontend/components/calendars/calendar-delete-button.tsx`) or in `CalendarList`:

- Add a **"Share"** option to the dropdown menu, **above** "Delete" — visible only to the owner.
- Clicking it opens `CalendarShareDialog`.

### 3.7 Home Page — `frontend/app/(app)/home/page.tsx`

- Same as 3.6 — the three-dots menu in the home page calendar list should also have the "Share" option above "Delete", visible to the owner.

### 3.8 Read-only mode for unauthenticated visitors (public calendars)

**Banner — new component `frontend/components/calendars/read-only-banner.tsx`**:

- A thin bar at the very top of the page (above everything).
- Text: "Viewing in read-only mode. Sign in to edit, save, or duplicate this trip."
- CTA buttons: **Sign in** → `/login` | **Create account** → `/register`.
- Shown when: user is **not logged in** and calendar is **public**.

**Disabled UI elements** (when unauthenticated):

- Add event button → disabled.
- Favourite button → disabled (hidden or visually disabled).
- Edit calendar button → hidden (owner-only anyway, so naturally absent).
- Left navigation bar (`frontend/lib/nav.ts` / rendered component) → all buttons disabled.
- Top navigation bar (`frontend/components/top-bar.tsx`) → all buttons disabled.
- When an event is clicked → edit dialog opens but Save and Delete buttons are hidden/disabled.

**Calendar page server component changes:**

- Make auth optional: attempt to get token but don't redirect if missing.
- Pass `isAuthenticated` (boolean) and `isPublic` (boolean) down to client components.
- If not authenticated and calendar is public → render read-only mode with banner.
- If not authenticated and calendar is private → render private calendar overlay (see 3.9).

### 3.9 Private Calendar Overlay — new component `frontend/components/calendars/private-calendar-overlay.tsx`

Shown when an unauthenticated user hits a **private** calendar URL:

- Calendar content is rendered in the background but blurred/darkened via an overlay.
- A centered card/modal on top states: "This calendar is private."
- Sub-text: "Ask the owner to share access."
- (No "Request access" flow for now.)

---

## 4. Implementation Order

1. **DB + migration** — add `is_public` column.
2. **Backend** — schema, CRUD, router changes.
3. **Types + actions** — frontend plumbing.
4. **CalendarEditForm** — visibility toggle.
5. **ShareDialog** — new component.
6. **Calendar page** — share button + read-only mode + private overlay.
7. **CalendarDeleteButton / CalendarList** — share option in three-dots menus (My Calendars + Home).
8. **Read-only banner** — top banner for unauthenticated visitors.
9. **Disable UI elements** — nav bars, buttons in read-only mode.

---

## 5. Decisions

1. **Share button on Calendar page** — visible to both **owner and editor**.
2. **Three-dots "Share" option (My Calendars / Home)** — visible to both **owner and editor**.
3. **Unauthenticated Calendar page** — token resolution is **optional** (no redirect); unauthenticated users can reach public calendars.
4. **Nav bars in read-only mode** — buttons are **visually disabled** (greyed out, non-clickable), not hidden.
5. **Event edit dialog for read-only visitors** — all inputs are **fully read-only** and all action buttons (Save, Delete) are **disabled**.
