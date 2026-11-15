# 1. Description

Users can attach one or more cost entries to a calendar event (e.g. "£2.50 Coffee", "£4.00 Tickets"). Each entry has a label, an amount, and a currency. The event detail popup shows all entries as chips and displays a grouped total per currency (e.g. `£6.50 · €45.00`). The same section appears in the add and edit event forms.

A user's preferred currency is stored on their account and is used as the default when adding a new cost entry. It can be changed in Settings. When a user changes their language (locale), their preferred currency is also updated to the locale's default.

# 2. Technical specification

## 2.1 Front end

- A new **Costs section** appears in the add event form, the edit event form, and the event detail popup.
- UI pattern: **Budget Chips (Variant B1)** — each entry is a pill chip showing `£2.50 Coffee`. A dashed "+ Add cost" chip opens a small popover with three fields: Label (required), a currency prefix select (GBP / EUR / USD), and Amount (required, positive only).
- Chips are delete-only (no inline editing). Clicking the × on a chip removes the entry.
- Totals are grouped by currency and displayed as a badge: `£6.50 · €45.00`. If all entries share one currency, only one total is shown.
- Costs are **visible on public (read-only) calendars** but the add/delete controls are hidden.
- Costs do **not** appear on the calendar grid — only in the event detail popup and edit form.
- A new **Currency section** is added to the Settings page (`/settings`), using the same button-picker style as Language. Supported currencies: GBP, EUR, USD.
- When the user changes locale in Settings, their preferred currency is also updated to the locale's default (en→GBP, es→EUR, pt→EUR, de→EUR).
- The preferred currency is stored in a `currency` cookie (same pattern as `locale`) and persisted to the DB. It is passed as a prop to form components from the server page.

## 2.2 Backend

- New `event_costs` table: `id`, `event_id` (FK → events, CASCADE), `label VARCHAR(255) NOT NULL`, `amount NUMERIC(10,2) NOT NULL CHECK (amount > 0)`, `currency VARCHAR(3) NOT NULL`, `created_at`.
- New `currency VARCHAR(3) NOT NULL DEFAULT 'GBP'` column on the `users` table.
- Two new endpoints on events router:
  - `POST /api/events/{event_id}/costs` → `EventCostResponse` (201) — requires editor role
  - `DELETE /api/events/{event_id}/costs/{cost_id}` → 204 — requires editor role
- `EventResponse` gains a `costs: list[EventCostResponse]` field (joined via `json_agg`, same pattern as `links`).
- `UserUpdate` schema gains a `currency: str | None` field. `UserResponse` gains `currency: str`.
- The existing `PATCH /api/users/{user_id}` endpoint already handles arbitrary `UserUpdate` fields — no router change needed.
- When locale is updated via `updateLocale` in the frontend settings action, currency is also patched to the locale's inferred default.

# 3. Other

Make sure to include the following files in your context:

- frontend/CLAUDE.md
- backend/CLAUDE.md
- ./CLAUDE.md
- backend/docs/coding-standards.md
- frontend/docs/coding-standards.md
