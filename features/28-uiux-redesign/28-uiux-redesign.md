# 28 — UI/UX redesign: "Boarding pass" theme

## Goal

Replace the stock shadcn neutral theme with a Kino identity that is simple but has character, and apply it to every existing page. Reference: `boarding-pass-theme-preview.html` in this folder.

## Direction

Travel paperwork — boarding passes, tickets, postcards. Warm paper, near-black ink, one departure-board orange. The character comes from monospaced data (times, routes, prices) and perforated ticket edges, not from decoration.

## Requirements

### Theme
- Light and dark palettes as in the preview (paper / ink / orange / teal / line / muted), wired into the existing shadcn tokens so every component picks them up.
- Fonts: **Bricolage Grotesque** (headings), **Geist** (body), **Geist Mono** (times, dates, routes, money), loaded with `next/font`.
- Radius slightly tighter (6px).
- Existing light/dark/system toggle keeps working.

### Event colours
- Six theme colours (terracotta, teal, ochre, sage, plum, slate) shown as quick swatches in the event form, with the existing free colour picker behind a "Custom" option.
- Default for new events: teal.
- Existing events keep their stored colours.
- Trip-builder stop colours use the same palette.

### Ticket details (as in the preview)
- Times and prices in mono everywhere they appear.
- Event cards: time/price stub, dashed perforation, title + place.
- Calendar page header: boarding-pass strip (route / dates / day x of y where available).
- Today highlighted in orange in the calendar.
- Hot Trips cards styled as postcards with a stamp label.

### Copy
- Rewrite empty states, success toasts and error messages in the new tone: short, warm, a little playful ("Nothing planned. The best kind of day.", "Wheels up. Add your first event.", "That didn't land. Try again?").
- All four locales (en, es, pt, de) — written natively, not literal translations.

### Pages in scope
All existing pages: marketing landing, login, signup, forgot/reset password, Hot Trips detail, home, my calendars, calendar detail, create/edit calendar, events, feedback, settings, deleted calendars, about. Plus the shell (top bar, sidebar, mobile bottom nav), dialogs and toasts.

## Out of scope
- New features or layout changes beyond what the theme needs.
- Changing stored event colours in the database.
