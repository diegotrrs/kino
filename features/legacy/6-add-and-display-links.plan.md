# Feature 6 — Add and Display Links on Events

## Context

Users need to attach one or more URLs to an event (e.g. booking confirmation, venue website). When a link is saved, the backend fetches the page's `<title>` tag and stores it. The frontend displays links as a clickable icon + truncated title (30 chars) list inside the edit event popup. Links are visible and clickable but not editable when the calendar is in read-only mode.

Decisions made:
- UI: URL input + Add button; each added link shows in a list with a delete (×) button. No inline edit.
- Title fallback: if the backend cannot fetch the page title, store the raw URL as the title.
- Links are only available in the **edit form** (`event-edit-form.tsx`). The creation forms do not show a Links section.
- API design: links are nested inside `EventResponse` as `links: EventLinkResponse[]`.

---

## Backend

### 1. Migration — `backend/migrations/add_event_links.sql`

```sql
CREATE TABLE IF NOT EXISTS event_links (
    id         SERIAL PRIMARY KEY,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url        VARCHAR(2048) NOT NULL,
    title      VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_links_event_id ON event_links(event_id);
```

Also add this table to `backend/init.sql` (after the `events` table block).

### 2. Schemas — `backend/app/schemas/event.py`

Add two new models:

```python
class EventLinkResponse(BaseModel):
    id: int
    event_id: int
    url: str
    title: str | None = None
    created_at: datetime

class EventLinkCreate(BaseModel):
    url: str
```

Update `EventResponse` to include:
```python
links: list[EventLinkResponse] = []
```

### 3. Title-fetching utility — `backend/app/utils/links.py`

Add `fetch_page_title(url: str) -> str`:
- Use `httpx` (add to dependencies if not already present; check `requirements.txt` / `pyproject.toml`) with a short timeout (~5s).
- Parse the response HTML for `<title>` using `html.parser` (stdlib).
- Return the stripped title text, or the raw URL on any exception (network error, timeout, non-HTML, missing `<title>`).

### 4. CRUD — `backend/app/crud/events.py`

Update `get_event()` and `get_events_by_calendar()` to join event_links using `json_agg`:

```sql
SELECT e.*,
    COALESCE(
        json_agg(
            json_build_object('id', el.id, 'event_id', el.event_id, 'url', el.url, 'title', el.title, 'created_at', el.created_at)
            ORDER BY el.id
        ) FILTER (WHERE el.id IS NOT NULL),
        '[]'
    ) AS links
FROM events e
LEFT JOIN event_links el ON el.event_id = e.id
WHERE e.id = %s
GROUP BY e.id
```

Add two new CRUD functions:
- `create_event_link(db, event_id: int, url: str, title: str) -> dict`
- `delete_event_link(db, link_id: int, event_id: int) -> bool`

### 5. Router — `backend/app/routers/events.py`

Add two endpoints (require `get_current_user`; verify user has editor role on the calendar):

```
POST   /api/events/{event_id}/links           body: EventLinkCreate  → EventLinkResponse (201)
DELETE /api/events/{event_id}/links/{link_id}                        → 204 No Content
```

The POST handler:
1. Fetches the event (404 if not found), checks user role (403 if viewer).
2. Calls `fetch_page_title(url)` to get the title (falls back to URL on failure).
3. Calls `crud.create_event_link(db, event_id, url, title)`.
4. Returns the created link.

---

## Frontend

### 1. Types — `frontend/lib/types.ts`

Add:
```typescript
export type EventLink = {
  id: number;
  event_id: number;
  url: string;
  title: string | null;
  created_at: string;
};
```

Update the `Event` type to include `links: EventLink[]`.

### 2. Server actions — `frontend/app/(app)/events/actions.ts`

Add:
- `addEventLink(eventId: number, url: string): Promise<EventLink>` — POST to `/api/events/{id}/links`
- `deleteEventLink(eventId: number, linkId: number): Promise<void>` — DELETE to `/api/events/{id}/links/{linkId}`

Both call `revalidatePath` after success.

### 3. New component — `frontend/components/events/event-links.tsx`

`'use client'` component. Props:
```typescript
type Props = {
  eventId: number;
  initialLinks: EventLink[];
  readOnly?: boolean;
};
```

Renders:
- A "Links" section label (translated).
- List of existing links: `<Link icon> <title truncated to 30 chars with ellipsis>` — the whole row opens the URL in a new tab (`target="_blank" rel="noreferrer"`). Shows a delete (×) `Button` variant="ghost" per link (hidden when `readOnly`).
- A URL `<Input>` + "Add" `<Button>` row (hidden when `readOnly`). The Add button is disabled while a request is in-flight. On submit, clears the input and calls `addEventLink`.
- Local state: `links` (starts from `initialLinks`), `inputValue`, `isAdding`.

### 4. Update forms

Add `<EventLinks>` below the Description `<FormField>` in the **edit form only**:

| File | Note |
|---|---|
| `frontend/components/event-edit-form.tsx` | Pass `eventId` and `readOnly` prop |

The creation forms (`event-add-form.tsx`, `events/event-create-dialog.tsx`) are not changed.

### 5. i18n — `frontend/messages/*.json`

Add translation keys to all four locale files (`en`, `es`, `pt`, `de`):
```json
{
  "eventLinks": {
    "title": "Links",
    "addPlaceholder": "https://...",
    "add": "Add",
    "adding": "Adding...",
    "deleteLink": "Delete link",
    "openLink": "Open link"
  }
}
```

---

## Tests

### Backend (`make check`)
- Unit tests for `fetch_page_title`: mock HTTP responses, verify fallback to URL on error.
- Integration tests for `POST /events/{id}/links` and `DELETE /events/{id}/links/{id}`: happy path, 403 for viewer role, 404 for unknown event.
- Verify `GET /events/{id}` now includes `links: []` for events with no links, and the correct array for events with links.

### Frontend
- Unit tests for `EventLinks` component: renders existing links, add flow, delete flow, read-only hides controls.
- E2E: open an event edit popup, add a link, verify it appears with a truncated title, click it, verify the URL opens; delete the link.

### Verification steps
1. Run migration against local DB.
2. `make check` in `backend/`.
3. `npm run build && npm run lint && npm run check` in `frontend/`.
4. Manually: edit an event, add a link with a real URL, verify the title is fetched and displayed truncated; reload and confirm persistence; test read-only mode.
