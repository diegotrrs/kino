# Spec: 22 — Trip checklist — V1

Status: implemented
GitHub issue #22: *Trip checklist*: to-dos before departure (book airport transfer, buy travel insurance), shared between members.

## Objective

Let the members of a calendar keep one shared to-do list for the trip on the calendar page: add things, tick them off, fix their wording, put them in order and remove them.

**Who:** members (owners and editors) of a calendar. Public read-only visitors do **not** see the checklist, since it can hold private to-dos like "Renew passport".

**User stories**

- As a member, I add "Buy travel insurance" to the trip checklist, and the other members see it the next time they open the calendar.
- As a member, I tick an item when it's done and untick it if I ticked it by mistake.
- As a member, I edit an item's text to fix a typo.
- As a member, I drag items into the order I want to do them in.
- As a member, I delete an item that's no longer relevant.
- As a member, I can tell how much is left at a glance (e.g. `3 / 7 done`).

## Decisions

| Topic | Decision |
|---|---|
| Domain term | **Checklist item**: a to-do attached to a calendar as a whole. Table `calendar_checklist_items`, type `ChecklistItem`, route `/{calendar_uuid}/checklist`, i18n namespace `checklist`. Add to `domain-terms.md`. Avoid: todo, task. |
| Fields | `text` (1–200 chars, HTML stripped) and `is_done`. No due date, assignee or "done by" in V1. |
| Who can edit | Any member (owner or editor), the same as calendar expenses and day names. |
| Who can see | Members only. Non-members and unauthenticated visitors of a public calendar get `403` from the API and the UI is not rendered. |
| Order | Explicit `position` set by dragging. New items go to the bottom. Ticked items **stay where they are** (shown struck through), so dragging and ticking don't fight. |
| Limit | At most 100 items per calendar (`409` beyond that). |
| Deleted calendars | Items are archived with the calendar and restored with it, the same way day names are (`deleted_calendar_checklist_items`). |
| Sync | No real-time sync. Other members see changes on their next page load. Writes are optimistic and roll back with a toast on failure. |

## Where it appears

- **Desktop (`lg+`):** a **Checklist** card in the right rail (`aside[aria-label='Trip details']`), below `ExpensesPanel`. It uses the same card style as the expenses card: a mono uppercase header with an icon and a `3 / 7` count, then the list itself inline (no drawer). For members the rail is now **always shown**, even when the trip has no expenses, so the checklist can be started from empty.
- **Phones and tablets:** a **Checklist chip** (`☑ 3/7`) next to `ExpensesChip` opens a bottom drawer. The drawer uses the same structure as `ExpensesDrawer` and holds the full list.
- **Empty state:** "Nothing on the list yet", with the add field focused when the drawer or card is opened.

## Interactions

- **Add:** a text field at the bottom of the list. Enter adds the item and keeps focus in the field for the next one. Empty or whitespace-only text is ignored.
- **Tick/untick:** a checkbox with a tap target of at least 44×44 px on phones. A ticked item's text is struck through and muted.
- **Edit:** tap/click the text to edit it in place. Enter or blur saves, Esc cancels. Clearing the text and saving does **not** delete the item; it cancels the edit.
- **Delete:** a trash icon on each row (shown on hover on desktop, always shown on touch). No confirmation dialog.
- **Reorder:** a drag handle on each row. It works with touch (drawer) and pointer (rail), and is keyboard-accessible (focus the handle, then use the arrow keys).

## API (backend, `routers/calendars.py`)

All endpoints require `get_current_user` and membership (`get_user_role(...) is not None`), otherwise `403`. If the calendar is unknown they return `404`.

| Method & path | Body | Response |
|---|---|---|
| `GET /api/calendars/{calendar_uuid}/checklist` | — | `200 list[ChecklistItemResponse]` ordered by `position` |
| `POST /api/calendars/{calendar_uuid}/checklist` | `ChecklistItemCreate { text }` | `201 ChecklistItemResponse` (appended to the bottom) |
| `PATCH /api/calendars/{calendar_uuid}/checklist/{item_id}` | `ChecklistItemUpdate { text?, is_done? }` | `200 ChecklistItemResponse`, or `404` if the item is not in this calendar |
| `PUT /api/calendars/{calendar_uuid}/checklist/order` | `ChecklistOrder { item_ids: list[int] }` | `204`. `400` unless `item_ids` is exactly this calendar's set of item ids |
| `DELETE /api/calendars/{calendar_uuid}/checklist/{item_id}` | — | `204`, or `404` |

`ChecklistItemResponse = { id, text, is_done, position, created_at, updated_at }`

**Migration** `backend/migrations/add_calendar_checklist_items.sql`:

```sql
CREATE TABLE IF NOT EXISTS calendar_checklist_items (
    id          SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    text        VARCHAR(200) NOT NULL,
    is_done     BOOLEAN NOT NULL DEFAULT FALSE,
    position    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_calendar_checklist_items_calendar_id
    ON calendar_checklist_items(calendar_id, position);
-- plus deleted_calendar_checklist_items mirror + RLS, as in add_calendar_day_names.sql
```

## Tech Stack

Same as the rest of the project: Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui and next-intl on the frontend; FastAPI, psycopg2 with raw SQL, and Pydantic on the backend.

Dragging needs a library. The frontend has none today, so we'll add **`@dnd-kit/core` + `@dnd-kit/sortable`** (approved): it supports touch and keyboard and is the usual choice for shadcn.

## Commands

```bash
# Backend (from backend/)
make check            # ruff check + unit tests with coverage + integration tests
ruff format .

# Frontend (from frontend/)
npm run build
npm run lint
npm run check         # vitest run && playwright test
npm run e2e:grep -- "checklist"
```

Before any e2e run, check that the backend on :8000 is **not** running against `.env.prod`.

## Project Structure

```
backend/
  migrations/add_calendar_checklist_items.sql   # new
  app/schemas/checklist.py                      # new: Create / Update / Order / Response
  app/crud/checklist.py                         # new: SQL only
  app/crud/calendars.py                         # archive + restore checklist items on delete/restore
  app/routers/calendars.py                      # 5 endpoints above
  tests/unit/test_checklist_router.py           # new: permission matrix, 400/404/409 mapping
  tests/integration/test_checklist.py           # new: ordering, reorder, cascade, archive/restore
frontend/
  lib/types.ts                                  # ChecklistItem type
  app/(app)/calendars/[uuid]/page.tsx           # fetch checklist (members only), render panel/chip
  app/(app)/calendars/actions.ts                # server actions: add/update/reorder/delete
  context/events-context.tsx                    # checklist state + drawer open state (or a small checklist context)
  components/calendars/checklist.tsx            # new: ChecklistPanel, ChecklistChip, ChecklistDrawer, ChecklistList
  components/calendars/checklist.test.ts        # new: pure helpers (counts, reorder)
  messages/{en,es,pt,de}.json                   # `checklist` namespace
  e2e/16-checklist.spec.ts                      # new
domain-terms.md                                 # add "Checklist item"
```

## Code Style

Follow `frontend/docs/coding-standards.md` and `backend/docs/coding-standards.md`, and mirror the calendar expenses and day names code. For example:

```python
@router.patch("/{calendar_uuid}/checklist/{item_id}", response_model=ChecklistItemResponse)
def update_checklist_item(
    calendar_uuid: str,
    item_id: int,
    body: ChecklistItemUpdate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    calendar_id = _get_id_by_uuid(db, calendar_uuid)
    if crud.get_user_role(db, calendar_id, current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    item = crud.update_checklist_item(db, calendar_id, item_id, body.model_dump(exclude_unset=True))
    if item is None:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    return item
```

```ts
export const getChecklistProgress = (items: ChecklistItem[]): { done: number; total: number } => ({
  done: items.filter((item) => item.is_done).length,
  total: items.length,
});
```

Frontend conventions: single quotes, const arrow functions, server actions for writes, every string in all four locale files.

## Testing Strategy

- **Backend unit** (`tests/unit/test_checklist_router.py`): a parametrised permission matrix covering non-member, unauthenticated and the owner/editor roles × every endpoint. On every rejection, assert that the mutating crud call was **not** made. Also cover `404` for an item from another calendar, `400` for a bad reorder set, `409` past 100 items, and HTML stripped from `text`.
- **Backend integration** (`tests/integration/test_checklist.py`): new items get `max(position)+1`; the list comes back in `position` order; reordering rewrites positions; a PATCH on another calendar's item changes nothing; deleting a calendar cascades; archive and restore round-trip the items.
- **Frontend unit** (vitest): pure helpers such as the progress count and optimistic reorder/rollback.
- **E2E** (Playwright, `e2e/16-checklist.spec.ts`): a member adds, ticks, edits, reorders (by keyboard) and deletes items, and everything survives a reload. A public visitor sees no checklist. Run on desktop and phone viewports.

## Boundaries

- **Always:** check membership on every checklist endpoint; use parameterised SQL; strip HTML from `text`; add i18n keys to all four locales; run `make check` and `npm run build && npm run lint && npm run check` before calling it done.
- **Ask first:** adding any dependency other than `@dnd-kit/core` + `@dnd-kit/sortable`; running the migration against production; changing the rail/drawer layout for the expenses panel beyond adding the checklist next to it.
- **Never:** expose checklist items to non-members or public visitors; run e2e against a backend that uses `.env.prod`; change existing expense or day-name endpoints.

## Success Criteria

1. A member can add, tick, untick, edit, reorder and delete checklist items on the calendar page, on desktop (rail) and phone (chip + drawer), and every change persists across reloads.
2. A second member of the same calendar sees the same items in the same order and state after a reload.
3. The progress count (`done / total`) is correct on both the chip and the card.
4. An unauthenticated visitor or non-member of a public calendar sees no checklist UI, and the API returns `403` to them.
5. Deleting a calendar and restoring it from Settings brings its checklist back unchanged.
6. Reordering works with touch, mouse and keyboard.
7. All strings are translated in en/es/pt/de.
8. `make check`, `npm run build`, `npm run lint` and `npm run check` all pass.
9. Nothing changes for events, expenses or day names. In particular, non-members still see the expenses rail exactly as today.

## Out of Scope (Deferred)

- Due dates on items: they need date UI and reminder semantics.
- Assigning items to a member: this depends on how the travellers panel evolves.
- "Done by Ana" attribution: needs a user id per tick; cheap to add later.
- Real-time sync between members: no realtime infrastructure exists yet.
- Several lists per trip (packing list, to-do list), and checklist templates.
- Hiding or clearing completed items in bulk.
- Linking a checklist item to an event or a day.

## Resolved Questions

1. **Dependency:** add `@dnd-kit/core` + `@dnd-kit/sortable` for dragging. **Yes.**
2. **Rail visibility:** the desktop rail and the phone chip row appear for members even when the trip has no expenses. **Yes.**
3. **Limits:** 200 characters per item, 100 items per calendar. **Yes.**
