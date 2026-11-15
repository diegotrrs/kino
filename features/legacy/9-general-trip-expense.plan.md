# General Trip Expenses — Implementation Plan

## Goal

Add expenses that belong to a calendar/trip as a whole (not tied to a specific event). These appear at the **top** of the existing expenses drawer (Variant B from prototype). The drawer title changes from "Trip budget" → "Expenses" in all four languages.

---

## 1. Database migration

New file: `backend/migrations/add_calendar_expenses.sql`

```sql
CREATE TABLE IF NOT EXISTS calendar_expenses (
    id          SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    label       VARCHAR(255) NOT NULL,
    amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency    VARCHAR(3) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_expenses_calendar_id ON calendar_expenses(calendar_id);
```

---

## 2. Backend — schemas

File: `backend/app/schemas/calendar.py`

Add at bottom:

```python
class CalendarExpenseCreate(BaseModel):
    label: str
    amount: float
    currency: str

class CalendarExpenseResponse(BaseModel):
    id: int
    calendar_id: int
    label: str
    amount: float
    currency: str
    created_at: datetime
```

---

## 3. Backend — CRUD

File: `backend/app/crud/calendars.py`

Add three functions:

```python
def get_calendar_expenses(db, calendar_id) -> list[dict]
def create_calendar_expense(db, calendar_id, label, amount, currency) -> dict
def delete_calendar_expense(db, expense_id, calendar_id) -> bool
```

Pattern mirrors `create_event_expense` / `delete_event_expense` in `crud/events.py`.

---

## 4. Backend — router

File: `backend/app/routers/calendars.py`

Add three endpoints (all require auth + membership check):

```
GET    /api/calendars/{uuid}/expenses              → list[CalendarExpenseResponse]
POST   /api/calendars/{uuid}/expenses              → CalendarExpenseResponse (201)
DELETE /api/calendars/{uuid}/expenses/{expense_id} → 204
```

Auth rule: same as existing calendar endpoints — user must have a role in `calendar_users`.  
Public calendars: `GET` allowed without auth (read-only view); `POST`/`DELETE` require membership.

---

## 5. Backend — tests

New file: `backend/tests/integration/test_calendar_expenses.py`

Tests to cover:

- `POST` returns 201 with correct fields
- `GET` returns list including the new expense
- `DELETE` returns 204 and expense is gone
- Non-member cannot `POST` or `DELETE` (403)
- `DELETE` on non-existent expense returns 404

---

## 6. Frontend — types

File: `frontend/lib/types.ts`

Add:

```ts
export type CalendarExpense = {
  id: number;
  calendar_id: number;
  label: string;
  amount: number;
  currency: string;
  created_at: string;
};
```

---

## 7. Frontend — server actions

File: `frontend/app/(app)/calendars/actions.ts` (new file, same pattern as `events/actions.ts`)

```ts
export const getCalendarExpenses = async (calendarUuid: string): Promise<CalendarExpense[]>
export const addCalendarExpense = async (calendarUuid: string, label, amount, currency): Promise<CalendarExpense>
export const deleteCalendarExpense = async (calendarUuid: string, expenseId: number): Promise<void>
```

Uses `fetch` to `API_BASE_URL/api/calendars/{uuid}/expenses` with the auth token cookie.

---

## 8. Frontend — EventsContext

File: `frontend/context/events-context.tsx`

Add to context type and provider:

```ts
calendarUuid: string | undefined
calendarExpenses: CalendarExpense[]
addCalendarExpense: (expense: CalendarExpense) => void
removeCalendarExpense: (id: number) => void
```

`calendarUuid` is needed by the drawer so it can call the server actions.  
`calendarExpenses` is initialised from `serverCalendarExpenses` prop (loaded at page level).

---

## 9. Frontend — Calendar page

File: `frontend/app/(app)/calendars/[uuid]/page.tsx`

- After fetching events, also fetch `/api/calendars/{uuid}/expenses` (same auth header pattern)
- Pass `calendarUuid={calendar.uuid}` and `serverCalendarExpenses={expenses}` to `EventsProvider`

---

## 10. Frontend — TripExpenseSummary → rename to ExpensesSummary

File: `frontend/components/calendars/trip-expense-summary.tsx` → rename to `expenses-summary.tsx`

Changes:

1. Read `calendarExpenses`, `calendarUuid`, `addCalendarExpense`, `removeCalendarExpense` from context
2. Compute totals from **both** event expenses and calendar expenses:
   ```ts
   const totals = tripTotals(events, calendarExpenses);
   ```
   Update `tripTotals` signature: `(events: CalendarEvent[], calendarExpenses: CalendarExpense[]) => ...`
3. Drawer title: `"Expenses"` (i18n key `expenses.drawerTitle`)
4. Drawer layout (Variant B):
   - General expenses section at **top** with `+ Add` toggle → inline form
   - Separator
   - Per-event breakdown below
5. Inline form calls `addCalendarExpense(calendarUuid, ...)` then updates context

---

## 11. Frontend — i18n

Update the `eventExpenses` namespace key `viewExpenses` to reflect the rename, and add new keys in all four language files:

| Key                 | en                       | es                           | pt                         | de                               |
| ------------------- | ------------------------ | ---------------------------- | -------------------------- | -------------------------------- |
| `drawerTitle`       | Expenses                 | Gastos                       | Despesas                   | Ausgaben                         |
| `generalExpenses`   | General expenses         | Gastos generales             | Despesas gerais            | Allgemeine Ausgaben              |
| `noGeneralExpenses` | No general expenses yet. | Aún no hay gastos generales. | Sem despesas gerais ainda. | Noch keine allgemeinen Ausgaben. |

---

## 12. Frontend — unit tests

File: `frontend/components/calendars/expenses-summary.test.ts`

Update `tripTotals` calls to pass a second argument `calendarExpenses`.  
Add new test cases: calendar expenses included in totals, mixed event + calendar expenses.

---

## 13. Frontend — E2E tests

File: `frontend/e2e/11-trip-expense-summary.spec.ts` → rename to `11-expenses-summary.spec.ts`

Add tests:

- General expenses section visible at top of drawer
- Can add a general expense → appears as chip, totals update
- Can delete a general expense → chip removed, totals update
- General expenses persist across page reload

---

## 14. Cleanup

Delete the prototype directory:  
`frontend/app/(app)/prototype/trip-expenses-general/`

---

## Verification checklist

```
Backend:  make check
Frontend: npm run build && npm run lint && npm run check
```

Manual:

- [ ] Open calendar with no expenses → pill hidden
- [ ] Add a general expense in drawer → pill appears with total
- [ ] Add an event expense → total updates (combined)
- [ ] Reload page → general expense still there (persisted in DB)
- [ ] Delete general expense → removed from UI and DB
- [ ] Read-only public calendar → drawer shows but it says "Travel expenses are visible only for editors or editors of this calendar"
