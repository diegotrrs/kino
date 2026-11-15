# Implementation Plan: 22 — Trip checklist

Source spec: `features/22-trip-checklist/22-trip-checklist.md`

## Overview

Members get one shared checklist per calendar. On desktop it's a card in the right rail; on phones it's a chip that opens a drawer. Members can add, tick, edit, delete and reorder items. The work is split into vertical slices: each task delivers a backend endpoint, its tests and the UI that uses it, so the feature works end to end after every task.

## Architecture Decisions

- **Mirror existing calendar-level features.** The new code follows calendar expenses and day names: a migration in `backend/migrations/`, `schemas/checklist.py`, `crud/checklist.py` (re-exported from `crud/__init__.py`), endpoints in `routers/calendars.py`, server actions in `app/(app)/calendars/actions.ts`, and state in `EventsProvider`.
- **Members-only GET.** Unlike expenses and day names, `GET /checklist` uses `get_current_user` (not `get_optional_user`) and requires a role. `page.tsx` only fetches it when `calendar.role` is set and passes `serverChecklist={null}` otherwise. Every checklist component renders nothing when the list is `null`.
- **Position as a dense integer.** A new item gets `COALESCE(MAX(position), -1) + 1`. A reorder rewrites every position `0..n-1` in one transaction from the full `item_ids` list. That's simple, and at ≤100 items the cost doesn't matter.
- **Optimistic UI with rollback.** Context holds `checklist: ChecklistItem[] | null` and exposes `setChecklist`. Each mutation updates local state first, calls the server action, and restores the previous array and shows a toast if the call fails. The pure helpers (`getChecklistProgress`, `moveChecklistItem`) live in `lib/checklist.ts` so they can be unit-tested.
- **Drawer state** lives in `EventsProvider` (`checklistOpen`), the same way `expensesOpen` does.
- **Reorder is the last feature slice.** It's the only part that adds a new dependency (`@dnd-kit/core` + `@dnd-kit/sortable`, approved), and it builds on the list component from Tasks 2–5.

## Dependency Graph

```
Migration + schemas + crud (T1)
   └── GET/POST endpoints (T1) ── page fetch + context + ChecklistPanel + add (T2)
          ├── PATCH (T3) ── tick / edit UI (T3)
          ├── DELETE (T4) ── delete UI (T4)
          ├── Phone chip + drawer (T5) — reuses the list component from T2–T4
          ├── Archive / restore on calendar delete (T6) — backend only
          └── PUT /order (T7) ── drag-and-drop UI (T7)  ← adds @dnd-kit
E2E + domain terms + final checks (T8) — after all of the above
```

## Task List

### Phase 1: Foundation — add and view on desktop

#### Task 1: Backend — checklist table, list and add endpoints ✅

**Description:** Create the `calendar_checklist_items` table and its `deleted_` mirror (with RLS, like `add_calendar_day_names.sql`). Add the Pydantic models (`ChecklistItemCreate` with `text` stripped of HTML and 1–200 characters, and `ChecklistItemResponse`) and the crud functions `get_checklist_items` and `create_checklist_item`. Add `GET` and `POST /api/calendars/{calendar_uuid}/checklist`, both members-only, with POST returning `409` at 100 items.

**Acceptance criteria:**
- [x] A member can POST an item; it's appended at `max(position)+1` and comes back in GET, ordered by position.
- [x] Non-members, unauthenticated users, and anonymous visitors to a *public* calendar get `401`/`403`, and no crud write is made.
- [x] Empty, whitespace-only or >200-character text returns `422`; HTML is stripped; the 101st item returns `409`.

**Verification:**
- [x] `cd backend && make check` (new `tests/unit/test_checklist_router.py` and `tests/integration/test_checklist.py` pass)
- [x] Migration applied to the **local** DB (`psql` on 5432)

**Dependencies:** None

**Files likely touched:**
- `backend/migrations/add_calendar_checklist_items.sql`
- `backend/app/schemas/checklist.py`
- `backend/app/crud/checklist.py`, `backend/app/crud/__init__.py`
- `backend/app/routers/calendars.py`
- `backend/tests/unit/test_checklist_router.py`, `backend/tests/integration/test_checklist.py`

**Estimated scope:** M (two of the files are tests)

#### Task 2: Frontend — Checklist card in the desktop rail, view and add ✅

**Description:** Add the `ChecklistItem` type. In `page.tsx`, fetch the checklist for members only and show the rail for members even when the trip has no expenses. Add `checklist` state to `EventsProvider` and an `addChecklistItem` server action. Build `ChecklistPanel` with the header and `done / total` count, the list (read-only rows for now) and the add field (Enter adds and keeps focus). Add the `checklist` i18n namespace in all four locales and the `getChecklistProgress` helper with a unit test.

**Acceptance criteria:**
- [x] On `lg+`, a member sees the Checklist card under the expenses card (or alone if there are no expenses), with the empty-state copy when there are no items.
- [x] Typing text and pressing Enter adds the item to the bottom immediately, and it's still there after a reload.
- [x] A logged-out visitor to a public calendar sees no card, and the rail looks exactly as it does today.

**Verification:**
- [x] `cd frontend && npm run build && npm run lint && npx vitest run lib/checklist`
- [x] Manual: add three items on desktop, reload, check the order is unchanged; open the same calendar logged out and confirm no checklist appears

**Dependencies:** Task 1

**Files likely touched:**
- `frontend/lib/types.ts`, `frontend/lib/checklist.ts`, `frontend/lib/checklist.test.ts`
- `frontend/app/(app)/calendars/[uuid]/page.tsx`
- `frontend/app/(app)/calendars/actions.ts`
- `frontend/context/events-context.tsx`
- `frontend/components/calendars/checklist.tsx`
- `frontend/messages/{en,es,pt,de}.json`

**Estimated scope:** M/L. This is the biggest slice; if it grows, split the i18n keys and the empty state into a follow-up.

### Checkpoint: Foundation
- [x] `make check` passes; `npm run build && npm run lint` pass
- [x] A member can add items on desktop and they persist; non-members see nothing
- [x] **Review with Diego before continuing**

### Phase 2: Core interactions

#### Task 3: Tick, untick and edit an item ✅

**Description:** Add `PATCH /checklist/{item_id}` (`ChecklistItemUpdate { text?, is_done? }`, `exclude_unset`, sets `updated_at`, `404` if the item belongs to another calendar) and the `updateChecklistItem` action. In the UI, add a checkbox with a ≥44 px tap target on touch and a struck-through, muted style for done items, plus inline text editing (Enter or blur saves, Esc cancels, an empty value cancels). All updates are optimistic with rollback.

**Acceptance criteria:**
- [x] Ticking or unticking updates the count right away and persists across a reload.
- [x] An edited text persists; Esc and empty-on-save leave the original text unchanged.
- [x] A PATCH on an item id from another calendar returns `404` and changes nothing; non-members get `403` and no crud write is made.

**Verification:**
- [x] `make check` (unit permission cases plus an integration test for the cross-calendar `404`)
- [x] `npm run build && npm run lint`
- [x] Manual: tick, reload, untick; edit, then press Esc

**Dependencies:** Task 2

**Files likely touched:** `schemas/checklist.py`, `crud/checklist.py`, `routers/calendars.py`, the backend tests, `actions.ts`, `checklist.tsx`, `messages/*.json`

**Estimated scope:** M

#### Task 4: Delete an item ✅

**Description:** Add `DELETE /checklist/{item_id}` (`204`/`404`, members-only) and the `deleteChecklistItem` action. Each row gets a trash icon: shown on hover on desktop, always shown on touch. There's no confirmation, and the delete is optimistic with rollback.

**Acceptance criteria:**
- [x] A deleted item disappears straight away and stays gone after a reload; the count updates.
- [x] Deleting another calendar's item returns `404`; non-members get `403` and no delete is made.

**Verification:**
- [x] `make check`; `npm run build && npm run lint`
- [x] Manual: delete the middle item, reload, check the remaining order is intact

**Dependencies:** Task 2 (independent of Task 3)

**Files likely touched:** `crud/checklist.py`, `routers/calendars.py`, the backend tests, `actions.ts`, `checklist.tsx`

**Estimated scope:** S

#### Task 5: Phone and tablet — checklist chip and drawer ✅

**Description:** Add `checklistOpen` to the context. Add a `ChecklistChip` (`☑ 3/7`) next to `ExpensesChip` in the `TripPass` summary line, shown for members even when there are no items. Add a `ChecklistDrawer` that reuses the bottom-sheet structure of `ExpensesDrawer` and the shared list component. When the drawer opens, the add field gets focus if the list is empty, and it stays visible above the keyboard (same approach as commit 60c96b5).

**Acceptance criteria:**
- [x] Below `lg`, a member sees the chip with the correct count; tapping it opens the drawer, and add, tick, edit and delete all work there.
- [x] The chip and drawer are hidden for non-members; the `ExpensesChip` layout is unchanged.

**Verification:**
- [x] `npm run build && npm run lint`
- [x] Manual at a 390 px viewport: open the drawer, add an item while the keyboard is open, close the drawer, check the chip count

**Dependencies:** Tasks 3 and 4

**Files likely touched:** `context/events-context.tsx`, `components/calendars/checklist.tsx`, `components/calendars/trip-pass.tsx`, `app/(app)/calendars/[uuid]/page.tsx`, `messages/*.json`

**Estimated scope:** M

#### Task 6: Keep the checklist when a calendar is deleted and restored ✅

**Description:** In `crud/calendars.py`, copy items into `deleted_calendar_checklist_items` in `delete_calendar` and copy them back in `restore_calendar` (keeping ids and positions), the same way day names are handled. Also clean the archive table in `crud/test.py`'s reset.

**Acceptance criteria:**
- [x] Deleting a calendar with three items and restoring it brings back the same three items, in the same order and with the same done states.
- [x] The e2e test reset leaves no orphaned archived checklist rows.

**Verification:**
- [x] `make check` (new integration test `TestChecklistSurvivesDeleteAndRestore`)

**Dependencies:** Task 1

**Files likely touched:** `backend/app/crud/calendars.py`, `backend/app/crud/test.py`, `backend/tests/integration/test_checklist.py`

**Estimated scope:** S

### Checkpoint: Core interactions
- [x] `make check`, `npm run build`, `npm run lint`, `npm run check` all pass
- [x] Add, tick, edit and delete work on desktop and phone and persist; delete-then-restore keeps the list
- [x] **Review with Diego before continuing**

### Phase 3: Reorder and finish

#### Task 7: Reorder by dragging ✅

**Description:** Add `PUT /checklist/order` (`ChecklistOrder { item_ids }`). It returns `400` unless the ids are exactly this calendar's item set, rewrites positions `0..n-1` in one transaction, and returns `204`. Add the `reorderChecklistItems` action and the `moveChecklistItem` pure helper with a unit test. In the UI, add a drag handle on each row using `@dnd-kit/core` + `@dnd-kit/sortable` with pointer, touch and keyboard sensors, in both the rail and the drawer. The reorder is optimistic with rollback.

**Acceptance criteria:**
- [x] Dragging an item (mouse, touch, or keyboard: focus the handle, Space, arrow keys, Space) changes the order, and it persists across a reload.
- [x] A reorder with missing, extra or foreign ids returns `400` and leaves positions untouched; non-members get `403`.
- [x] Ticking an item doesn't move it.

**Verification:**
- [x] `make check`; `npx vitest run lib/checklist`; `npm run build && npm run lint`
- [x] Manual: reorder on desktop with the mouse, with the keyboard, and in the phone drawer by touch (DevTools touch emulation)

**Dependencies:** Task 5

**Files likely touched:** `schemas/checklist.py`, `crud/checklist.py`, `routers/calendars.py`, the backend tests, `actions.ts`, `lib/checklist.ts` (+ test), `checklist.tsx`, `package.json`

**Estimated scope:** M/L

#### Task 8: E2E, domain terms and final checks ✅

**Description:** Write `e2e/16-checklist.spec.ts`:
- **@16.1:** add, tick, edit and delete on desktop, then reload.
- **@16.2:** the same core flow through the phone chip and drawer.
- **@16.3:** keyboard reorder persists.
- **@16.4:** a logged-out visitor to a public calendar sees no checklist.

Also add "Checklist item" to `domain-terms.md`.

**Acceptance criteria:**
- [x] All four e2e tests pass locally.
- [x] All of the spec's success criteria (1–9) can be ticked.

**Verification:**
- [x] First, confirm the backend on :8000 is **not** using `.env.prod`
- [x] `cd backend && make check`; `cd frontend && npm run build && npm run lint && npm run check`

**Dependencies:** Tasks 1–7

**Files likely touched:** `frontend/e2e/16-checklist.spec.ts`, `frontend/e2e/helpers/api.ts` (if a checklist helper is useful), `domain-terms.md`

**Estimated scope:** S/M

### Checkpoint: Complete
- [x] Every spec success criterion is met
- [x] All the CLAUDE.md commands pass (`npm run build`, `npm run lint`, `npm run check`, `make check`)
- [x] Spec `Status:` set to `implemented`; ready for review

## Parallelisation

- Task 6 (archive/restore) only depends on Task 1 and can run alongside Tasks 2–5.
- Tasks 3 and 4 touch the same files (`checklist.tsx`, `routers/calendars.py`), so do them one after the other.
- Everything else is sequential.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Showing the rail and chip for members with no expenses changes today's layout | Med | Only members are affected; check that non-member rendering is unchanged in Task 2; add an e2e check in Task 8 |
| Dragging inside the bottom drawer conflicts with scrolling and swipe-to-close | Med | Drag only from the handle, use a `TouchSensor` activation delay, and test it early in Task 7 |
| Concurrent edits by two members (e.g. a reorder that races an add) | Low | The reorder `400`s on a stale id set; the client rolls back and shows a toast suggesting a reload. Real-time sync is deferred |
| The migration gets run against production by accident | High | Apply it only locally during development; running it against production needs explicit approval (spec boundary) |
| `EventsProvider` keeps growing | Low | Acceptable for V1; if Task 5 makes it unwieldy, extract a `ChecklistProvider` within the same task |

## Resolved Questions

1. `@dnd-kit/core` + `@dnd-kit/sortable` may be added (Task 7). **Yes.**
2. The rail (desktop) and the chip (phones) are shown for members even on trips with no expenses (Tasks 2 and 5). **Yes.**
3. Limits are 200 characters per item and 100 items per calendar (Task 1). **Yes.**
