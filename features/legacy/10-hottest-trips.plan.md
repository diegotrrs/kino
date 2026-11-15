# Feature 10 — Hot Trips

## Context

Users need inspiration to plan trips. A "Hot Trips" carousel on the Home page shows curated destination cards; clicking one opens a static destination page with photos and a CTA to create a calendar. A new `start_date` field on the Calendar model drives when the calendar view opens and gives structure to trip planning.

---

## 1. Backend — `start_date` on Calendar

### 1a. Migration
**New file:** `backend/migrations/add_start_date_to_calendars.sql`

```sql
-- Add nullable first, backfill, then enforce NOT NULL
ALTER TABLE calendars ADD COLUMN start_date DATE;

UPDATE calendars
SET start_date = (
  SELECT MIN(e.date) FROM events e WHERE e.calendar_id = calendars.id
)
WHERE EXISTS (SELECT 1 FROM events e WHERE e.calendar_id = calendars.id);

-- Calendars with no events fall back to created_at date
UPDATE calendars
SET start_date = created_at::date
WHERE start_date IS NULL;

ALTER TABLE calendars ALTER COLUMN start_date SET NOT NULL;
```

### 1b. Schema — `backend/app/schemas/calendar.py`
- `CalendarCreate`: add `start_date: date | None = None` — optional, server defaults to today if omitted
- `CalendarUpdate`: add `start_date: date | None = None`
- `CalendarResponse`: add `start_date: date`

### 1c. CRUD — `backend/app/crud/calendars.py`
- `create_calendar`: add `start_date` to INSERT columns and VALUES; if `None`, use `CURRENT_DATE` as the default
- `update_calendar`: already uses a dynamic `set_clause` pattern — no change needed

---

## 2. Frontend — Calendar create form

### 2a. Type — `frontend/lib/types.ts`
Add `start_date: string` to the `Calendar` interface.

### 2b. Server action — `frontend/app/(app)/calendars/actions.ts`
Update `createCalendar(name)` → `createCalendar(name, startDate: string)`, pass `start_date` in the POST body.

### 2c. Form — `frontend/components/calendars/calendar-create-form.tsx`
- Add optional `start_date` to Zod schema
- Add a date picker field using the shadcn `Calendar` + `Popover` pattern (reference: `event-form.tsx`)
- If user skips the field, omit it from the payload (backend defaults to today)
- Pass `start_date` formatted as `yyyy-MM-dd` when set
- Read optional `?name=` query param on mount and pre-fill the name field (page becomes a client component or passes `searchParams` from the server page)

### 2d. Edit form — `frontend/components/calendars/calendar-edit-form.tsx`
- Add the same optional date picker for `start_date`
- Pre-populated from the existing `calendar.start_date` value
- Passes updated value through the existing edit server action / PATCH endpoint

### 2e. Translations — `messages/{en,es,pt,de}.json`
Add under `"createCalendar"` (and reuse in the edit form):
- `"startDate"`: "Start date"
- `"startDatePlaceholder"`: "Pick a date"

---

## 3. Frontend — Calendar page uses `start_date`

**File:** `frontend/app/(app)/calendars/[uuid]/page.tsx`

Replace the current "latest event" `initialDate` computation with:

```ts
const initialDate = new Date(`${calendar.start_date}T12:00:00`);
```

`calendar.start_date` is always present (NOT NULL), so no fallback needed. Remove the `latestEvent` reduce logic added previously.

---

## 4. Frontend — Static destination pages

### 4a. Install shadcn Carousel
```bash
npx shadcn@latest add carousel
```
Adds `frontend/components/ui/carousel.tsx`.

### 4b. Static trips data
**New file:** `frontend/app/(marketing)/trips/trips-data.ts`

```ts
export type Trip = {
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string;    // Unsplash URL
  galleryImage: string;  // second photo
  description: string;   // 2–3 sentence blurb
};

export const TRIPS: Trip[] = [
  { slug: 'costa-rica',  title: 'Costa Rica',  subtitle: 'The Perfect 2-Week Adventure', ... },
  { slug: 'albania',     title: 'Albania',     subtitle: "Europe's Hidden Riviera", ... },
  { slug: 'uzbekistan',  title: 'Uzbekistan',  subtitle: 'Journey Along the Silk Road', ... },
  { slug: 'wales',       title: 'Wales',       subtitle: 'Castles, Coast & Mountains', ... },
  { slug: 'guatemala',   title: 'Guatemala',   subtitle: 'Land of Volcanoes & Lakes', ... },
  { slug: 'thailand',    title: 'Thailand',    subtitle: 'Temples, Islands & Street Food', ... },
  { slug: 'japan',       title: 'Japan',       subtitle: 'From Tokyo to Kyoto', ... },
  { slug: 'norway',      title: 'Norway',      subtitle: 'Escape the Summer Heat', ... },
];
```

Images: Unsplash source URLs — no download needed. Add `images.unsplash.com` to `next.config.ts` `images.remotePatterns`.

### 4c. Destination page — `frontend/app/(marketing)/trips/[slug]/page.tsx`
- `generateStaticParams` returns all 8 slugs → fully static (SSG), public
- Inherits the existing `(marketing)` layout: sticky header with logo + "Go to App" / "Sign In" (no layout changes needed)
- Layout: `← Back` link to `/home` at the top, full-width hero image, title + subtitle, second photo, description paragraph, CTA button: **"Plan your trip to {title}"** → `href="/calendars/create?name={title: subtitle}"` — pre-fills the calendar name field
- Uses `next/image` for both photos
- `notFound()` if slug is unknown

### 4d. `next.config.ts`
```ts
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
},
```

---

## 5. Frontend — Home page carousel

### 5a. New component — `frontend/components/home/hot-trips-carousel.tsx`
- `'use client'` — shadcn Carousel requires it
- Imports `TRIPS` from the static data file
- Renders a shadcn `Carousel` of `Card` items
- Each card: `next/image` thumbnail, destination title + subtitle
- Each card wraps in `<Link href={'/trips/${trip.slug}'}>`

### 5b. Home page — `frontend/app/(app)/home/page.tsx`
Add a new `<section>` below the Favourites section:

```tsx
<section className='space-y-3'>
  <h3 className='text-base font-semibold tracking-tight'>{t('hotTrips')}</h3>
  <HotTripsCarousel />
</section>
```

### 5c. Landing page — `frontend/app/(marketing)/page.tsx`
Add the same `<HotTripsCarousel />` in a new section near the bottom of the landing page (before the final CTA block). Since `HotTripsCarousel` is a `'use client'` component with no auth dependency, it works in both route groups without modification.

### 5d. Translations — all 4 locale files
Add under `"home"` and `"marketing"` namespaces:
- `"hotTrips"`: "Hot Trips" / "Viajes de Moda" / "Viagens em Alta" / "Beliebte Reisen"

---

## Files changed summary

| File | Change |
|------|--------|
| `backend/migrations/add_start_date_to_calendars.sql` | NEW — migration |
| `backend/app/schemas/calendar.py` | Add `start_date` to Create / Update / Response |
| `backend/app/crud/calendars.py` | Add `start_date` to INSERT |
| `frontend/lib/types.ts` | Add `start_date: string` to `Calendar` |
| `frontend/app/(app)/calendars/actions.ts` | Pass `start_date` in createCalendar |
| `frontend/components/calendars/calendar-create-form.tsx` | Add optional date picker field |
| `frontend/components/calendars/calendar-edit-form.tsx` | Add optional date picker field, pre-filled |
| `frontend/app/(app)/calendars/[uuid]/page.tsx` | Use `calendar.start_date` as `initialDate` |
| `frontend/app/(marketing)/trips/trips-data.ts` | NEW — static trip data |
| `frontend/app/(marketing)/trips/[slug]/page.tsx` | NEW — destination pages (SSG) |
| `frontend/components/home/hot-trips-carousel.tsx` | NEW — carousel component |
| `frontend/app/(app)/home/page.tsx` | Add Hot Trips section |
| `frontend/app/(marketing)/page.tsx` | Add Hot Trips section before final CTA |
| `frontend/next.config.ts` | Add Unsplash to image remote patterns |
| `frontend/messages/{en,es,pt,de}.json` | New i18n keys |

---

## Verification

1. Apply migration to local DB; confirm `start_date` is NOT NULL and backfilled correctly
2. `make check` — backend passes
3. Open `/calendars/create` — start date picker is present but optional; omitting it still creates the calendar (defaulting to today)
4. Open an existing calendar — opens on the month of `start_date`, not today
5. Visit `/trips/japan`, `/trips/costa-rica` — hero image, description, and CTA visible
6. Log in → `/home` → Hot Trips carousel appears below Favourites
7. Visit `/` (landing page) → Hot Trips carousel visible before the final CTA
8. Click a destination card → destination page loads with back link, hero, and "Plan your trip" CTA
9. Click "Plan your trip to Japan" → `/calendars/create` with name pre-filled
10. `npm run build && npm run lint && npm run check` — all pass clean
