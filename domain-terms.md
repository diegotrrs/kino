# Domain Terms

Canonical terms to use consistently across code, UI, translations, database schemas, API endpoints, and documentation.

| Term | Definition | Terms to Avoid | Notes |
|------|------------|----------------|-------|
| **Calendar** | A named collection of events representing a trip or shared schedule. Identified by a UUID in URLs and API routes. | schedule, trip (as a type name), planner | Use `calendar` / `calendars` in routes, DB tables, and variable names. |
| **Event** | A single dated activity within a calendar, with a title, time range, optional description, location, colour, links, and expenses. | entry, item, occurrence, appointment | Use `event` / `events` in routes, DB tables (`events`, `event_expenses`, `event_links`), and variable names. |
| **Event expense** | A monetary amount attached to a specific event (e.g. museum ticket, hotel). Stored in `event_expenses`. | event cost, event cost entry, item cost | Use `expense` / `expenses` in variable names, table names, API routes (`/expenses`), UI labels, and i18n keys. Type name: `EventExpense`. |
| **Calendar expense** | A monetary amount attached to a calendar as a whole — not tied to a specific event (e.g. travel insurance, visa fee). Stored in `calendar_expenses`. | general cost, trip cost, calendar cost | Use `calendarExpense` / `calendarExpenses` in variable names and i18n keys. Type name: `CalendarExpense`. Route: `/{uuid}/expenses`. |
| **Member** | Any authenticated user who has access to a calendar, regardless of their role. Includes owners and editors. | user, collaborator, participant | Use `member` in UI copy and documentation. In code, role is stored as `'owner'` or `'editor'` — there is no literal `member` DB value. |
| **Owner** | A member with full control over a calendar: can edit settings, invite and remove other members, and delete the calendar. | admin, creator, host | Use `owner` in role checks (`role === 'owner'`), UI labels, and documentation. |
| **Editor** | A member who can add, edit, and delete events and expenses but cannot manage calendar settings or members. | contributor, collaborator | Use `editor` in role checks (`role === 'editor'`), UI labels, and documentation. |
| **Favourite** | A calendar that a user has marked for quick access. Displayed prominently in the home and My Calendars views. | favorite (US spelling), bookmark, starred | Use British spelling `favourite` throughout — in DB column `is_favourite`, API field `is_favourite`, i18n keys, and all UI copy. |
| **Link** | A URL attached to an event, with an optional title fetched from the page metadata. Stored in `event_links`. | URL, bookmark, attachment, resource | Use `link` / `links` in DB tables (`event_links`), variable names, and UI labels. Type name: `EventLink`. |
