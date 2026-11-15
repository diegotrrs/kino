# 28 — UI/UX redesign plan

Feature: `28-uiux-redesign.md` · Visual reference: `boarding-pass-theme-preview.html`

Decisions confirmed:
- **Event colours:** six theme swatches plus a "Custom" free picker. Old events keep their colours; new events default to teal.
- **Copy:** rewrite empty states, toasts and errors in all four locales.
- **Ticket details:** full set, as in the preview.

Delivered in phases. Each phase leaves the app working and passes `npm run build`, `npm run lint` and `npm run check`, so it can be reviewed and committed on its own.

---

## Phase 1 — Theme foundation (affects every page at once)

**`app/globals.css`**
- Replace the `:root` and `.dark` HSL values with the boarding-pass palette, mapped onto the existing shadcn tokens:

  | shadcn token | Light | Dark |
  |---|---|---|
  | `background` | paper `#F7F4EE` | `#16181D` |
  | `card` / `popover` | surface `#FFFDF9` | `#1E2128` |
  | `foreground` | ink `#1C1B19` | `#F1EEE8` |
  | `primary` (buttons, today) | orange `#E8542F` | `#F06A45` |
  | `primary-foreground` | `#FFFFFF` | `#16181D` |
  | `secondary` / `accent` | line-tinted `#EFEAE1` | `#262A32` |
  | `muted-foreground` | `#8A857C` / `#5E5A53` | `#8C877F` |
  | `border` / `input` | `#E9E4DA` | `#2C3039` |
  | `ring` | orange | orange |
  | `destructive` | keep red, retuned to sit with the palette | |

- Add new tokens and expose them through `@theme`:
  - `--color-teal` and `--color-teal-soft`, for links and the selected state.
  - `--color-ev-{terracotta,teal,ochre,sage,plum,slate}`.
  - `--font-display`, `--font-sans` and `--font-mono`.
- Set `--radius` to `0.375rem`.
- Set the body font to `var(--font-sans)` instead of Arial.
- Restyle FullCalendar (`.fc` variables and selectors): grid lines use `border`, the day-number font uses `font-display`, today is orange, the toolbar is themed and the dark mode is readable.

**`app/layout.tsx`**
- Load Bricolage Grotesque, Geist and Geist Mono with `next/font/google`.
- Set them as CSS variables on `<html>`.

**`components/ui/*` (shadcn primitives)**
- Button: the primary variant uses orange; a new `teal` variant if it's needed for links.
- Card: 1px `border`, no shadow by default; the theme marks cards with borders rather than shadows.
- Input, Select, Dialog, Toast and Tabs: check them against the tokens only. Most need no change, because they already use the tokens.

**Hardcoded colours.** About 9 files use classes like `bg-white`, `text-gray-800` or `bg-neutral-900`. Replace them with tokens. Stars like `text-yellow-400` become `ochre`.

The result: every page picks up the new palette, fonts and radius.

## Phase 2 — Shell and shared components

- **`top-bar.tsx`, `desktop-sidebar.tsx`, `mobile-bottom-nav.tsx`:**
  - "kino" wordmark in the display font with an orange dot.
  - The active nav item gets a `secondary` background, as in the preview.
- **New `components/ui/ticket.tsx`:** small presentational pieces, `<TicketStub>` (a mono header plus a dashed perforation) and `<Mono>` (tabular nums). Event cards, the boarding-pass strip and the expenses panel reuse them.
- **New `components/ui/stamp.tsx`:** the rotated stamp label for Hot Trips.
- **New `lib/format.ts` helpers, or extend the existing ones:** consistent formatting for times (`09:40`), money (`€ 64`) and dates (`12–18 MAY`), respecting the locale. Unit tests go in `format.test.ts`.

## Phase 3 — Calendar experience (the core screens)

- **Calendar page (`calendars/[uuid]/page.tsx`):**
  - Display-font title.
  - A **boarding-pass strip** showing the start date, number of days (from the last event) and travellers, plus "Day x of y" when today falls within the trip. Calendars have no route field, so the strip shows dates, days and travellers; a route only appears later if we add one.
- **`components/calendar.tsx` `EventItem`:** ticket-stub event (mono time, dashed line, title), tinted from the event colour. Readable on both themes, and it degrades to a compact pill in month cells, where space is tight.
- **Event timeline and `event-list.tsx`:** the same ticket stub; prices in mono.
- **`expenses-summary.tsx`:** big mono total, teal budget meter and mono rows.
- **`calendar-members.tsx`:** coloured initials avatars using the event palette.
- **`read-only-banner.tsx` and `private-calendar-overlay.tsx`:** use tokens.

## Phase 4 — Event colours

- **`event-form.tsx`:**
  - A row of six swatches (`--color-ev-*` stored as hex values).
  - A "Custom" button opens the existing `HexColorPicker`.
  - The default and `lastEventColor` fallback become teal (`#2F5D62`) instead of `#76c7ef`.
- **The shared constant:** the palette is defined once in `lib/event-colors.ts` (`EVENT_COLORS as const`) and used by the form and by the trip builder `STOP_COLORS` in `calendars/actions.ts`.
- **Dark mode:** events store a hex colour. The tint is computed (`color-mix` with the surface colour), so the stored light hex still looks right on dark backgrounds.
- **`utils/data.ts` seed colours:** switch them to the palette.

## Phase 5 — Remaining pages

- **Home:**
  - `hot-trips-carousel.tsx` becomes postcard cards with an image, a dashed side panel, a stamp ("HOT · MAY") and a mono price if one is available.
- **My Calendars (`calendar-list.tsx`):** each calendar is a ticket-like card with the name in display font and the dates in mono.
- **Create and edit calendar, events, feedback (`feedback-form`, `wishlist`), settings, deleted calendars and about:** token cleanup, display-font headings and mono dates.
- **Marketing landing (`(marketing)/page.tsx`) and `travel-background.tsx`:**
  - Hero in the display font, an orange CTA, and the illustration recoloured to the palette.
  - Light rework only, no new sections.
- **Auth pages (login, signup, forgot and reset):** themed card plus the wordmark.
- **Hot Trips detail (`trips/[slug]`):** postcard header; `trip-map.tsx` marker colours (currently `#171717`) become ink/orange.

## Phase 6 — Copy in the new tone

- **Scope:** empty states, success toasts (34 `toast(` calls), error messages and the main CTAs/headings, across all four locale files.
- **Order of work:**
  1. Write `en` first.
  2. Write `es`, `pt` and `de` natively, keeping the tone, not translating word for word.
  3. Review the result as a table before applying it.
- **Rules:**
  - Short and warm, never vague.
  - Errors still say what went wrong and how to fix it.
  - No jokes on destructive actions, such as deleting a calendar.
- **No new keys unless needed**, and every key is added to all four files.
- **Before changing copy:** check the e2e specs that assert on text, and update the specs together with the copy.

## Phase 7 — Verification

- `npm run build`, `npm run lint`, `npm run check` and the unit tests.
- Full Playwright run locally. Selectors relying on role/name should survive; text assertions change in Phase 6.
- Screenshot pass in Chrome: every page in light and dark, at desktop and 400px width.
- Contrast check: white on orange is around 3.6:1, which is OK for bold 14px+ button text but not body text. Use `primary` only for buttons and accents, never for small text on paper.

---

## Risks and notes

- **FullCalendar** has its own CSS. Theming it is the biggest single chunk, especially month cells with the ticket stub. The fallback is a compact pill in month view.
- **The `.dark` class approach stays:** `next-themes` uses `attribute='class'`. The preview's `data-theme` approach doesn't apply here.
- **Fonts:** `next/font` self-hosts them, so there's no layout shift and no external request at runtime.
- **Size:** around 40–60 files in total. Phases 1–2 already give most of the visual change.

---

## Status (2026-11-01)

- Phases 1–5 done and committed on `28-uiux-redesign` (b5031c2, 791c027, e74e4d8).
- Phase 6 (copy) is waiting for review in `copy-review.md`.
- Phase 7: unit tests (104), lint, tsc and `npm run build` pass. Full e2e run gave 84 passed and 1 dev-mode timeout flake (11.9, passed on retry).
- Deviation: no `lib/format.ts`. The existing `formatAmount` already covers money; times and dates got mono styling instead of a new helper.
- Added `lib/trip-span.ts` (with tests) for the trip pass.
