# Feature 8 — Cost Entries on Events

## Decisions

- UI: Budget Chips (B1) — label required, per-entry currency, delete-and-re-add only
- Currency: per entry (ISO 3166 code stored in DB); grouped totals per currency in view
- Preferred currency: stored in `users.currency` + `currency` cookie; inferred from locale on locale change
- Supported currencies: GBP, EUR, USD
- Locale→currency map: en→GBP, es→EUR, pt→EUR, de→EUR
- Costs visible on public calendars (read-only), not on calendar grid
- Negative amounts not allowed (`CHECK (amount > 0)`)

---

## Backend

### 1. Migration — `backend/migrations/add_event_costs.sql`

```sql
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'GBP';

CREATE TABLE IF NOT EXISTS event_costs (
    id         SERIAL PRIMARY KEY,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    label      VARCHAR(255) NOT NULL,
    amount     NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency   VARCHAR(3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_costs_event_id ON event_costs(event_id);
```

Also add both statements to `backend/init.sql` — the `ALTER TABLE users` after the existing users block, the `CREATE TABLE event_costs` after the `event_links` block.

### 2. Schemas — `backend/app/schemas/event.py`

Add before `EventBase`:

```python
class EventCostCreate(BaseModel):
    label: str
    amount: float
    currency: str

class EventCostResponse(BaseModel):
    id: int
    event_id: int
    label: str
    amount: float
    currency: str
    created_at: datetime
```

Update `EventResponse`:

```python
class EventResponse(EventBase):
    id: int
    uuid: UUID
    created_at: datetime
    updated_at: datetime | None = None
    links: list[EventLinkResponse] = []
    costs: list[EventCostResponse] = []   # ← add
```

### 3. Schemas — `backend/app/schemas/user.py`

```python
class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    locale: str | None = None
    currency: str | None = None   # ← add

class UserResponse(BaseModel):
    id: int
    uuid: UUID
    name: str
    email: str
    locale: str = 'en'
    currency: str = 'GBP'         # ← add
    created_at: datetime
    updated_at: datetime | None = None
```

### 4. CRUD — `backend/app/crud/events.py`

Add a `_COSTS_AGG` constant alongside `_LINKS_AGG`:

```python
_COSTS_AGG = """
    COALESCE(
        json_agg(
            json_build_object(
                'id',         ec.id,
                'event_id',   ec.event_id,
                'label',      ec.label,
                'amount',     ec.amount,
                'currency',   ec.currency,
                'created_at', ec.created_at
            ) ORDER BY ec.id
        ) FILTER (WHERE ec.id IS NOT NULL),
        '[]'
    ) AS costs
"""
```

Update every query that uses `_LINKS_AGG` to also join and select `_COSTS_AGG`:

- `get_event` — add `LEFT JOIN event_costs ec ON ec.event_id = e.id`, add `{_COSTS_AGG}` to SELECT, add `ec.id` to GROUP BY (or keep `GROUP BY e.id` since it already groups by PK)
- `get_events` — same joins
- `get_events_by_calendar` — same joins
- `create_event` — set `row["costs"] = []` alongside `row["links"] = []`

Add two new CRUD functions:

```python
def create_event_cost(
    db: connection, event_id: int, label: str, amount: float, currency: str
) -> dict:
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO event_costs (event_id, label, amount, currency)
            VALUES (%s, %s, %s, %s)
            RETURNING *
            """,
            (event_id, label, amount, currency),
        )
        row = cur.fetchone()
        db.commit()
        return row


def delete_event_cost(db: connection, cost_id: int, event_id: int) -> bool:
    with db.cursor() as cur:
        cur.execute(
            "DELETE FROM event_costs WHERE id = %s AND event_id = %s",
            (cost_id, event_id),
        )
        deleted = cur.rowcount > 0
        db.commit()
        return deleted
```

### 5. CRUD — `backend/app/crud/__init__.py`

Export `create_event_cost` and `delete_event_cost` (check the existing export pattern in this file and mirror it).

### 6. Router — `backend/app/routers/events.py`

Add to imports:

```python
from ..schemas.event import (
    EventCostCreate, EventCostResponse,  # ← add
    EventCreate, EventLinkCreate, EventLinkResponse, EventResponse, EventUpdate,
)
```

Add two endpoints after the existing link endpoints:

```python
@router.post("/{event_id}/costs", response_model=EventCostResponse, status_code=201)
def create_event_cost(
    event_id: int,
    body: EventCostCreate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = crud.get_event(db, event_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if crud.get_user_role(db, existing["calendar_id"], current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    return crud.create_event_cost(db, event_id, body.label, body.amount, body.currency)


@router.delete("/{event_id}/costs/{cost_id}", status_code=204)
def delete_event_cost(
    event_id: int,
    cost_id: int,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = crud.get_event(db, event_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if crud.get_user_role(db, existing["calendar_id"], current_user["id"]) is None:
        raise HTTPException(status_code=403, detail="Not a member of this calendar")
    crud.delete_event_cost(db, cost_id, event_id)
```

---

## Frontend

### 7. Types — `frontend/lib/types.ts`

Add:

```typescript
export type EventCost = {
  id: number;
  event_id: number;
  label: string;
  amount: number;
  currency: string;
  created_at: string;
};
```

Update `Event`:

```typescript
export interface Event {
  // ... existing fields
  costs: EventCost[];   // ← add
}
```

### 8. Server actions — `frontend/app/(app)/events/actions.ts`

Add two actions following the same structure as `addEventLink` / `deleteEventLink`:

```typescript
export const addEventCost = async (
  eventId: number,
  label: string,
  amount: number,
  currency: string,
): Promise<EventCost> => {
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/costs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ label, amount, currency }),
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to add cost');
  return res.json();
};

export const deleteEventCost = async (
  eventId: number,
  costId: number,
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/costs/${costId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error('Failed to delete cost');
};
```

Follow the exact same token/cookie pattern as the existing actions in that file.

### 9. Settings action — `frontend/app/(app)/settings/actions.ts`

Add `updateCurrency`, mirroring `updateLocale` exactly:

```typescript
const LOCALE_CURRENCY: Record<string, string> = {
  en: 'GBP', es: 'EUR', pt: 'EUR', de: 'EUR',
};

export const updateCurrency = async (currency: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set('currency', currency, { path: '/', sameSite: 'lax' });

  const token = cookieStore.get('token')?.value;
  if (token) {
    try {
      const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (meRes.ok) {
        const user = await meRes.json();
        await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ currency }),
        });
      }
    } catch {
      // best-effort
    }
  }
  revalidatePath('/', 'layout');
};
```

Also update `updateLocale` to additionally update the currency to the locale's default **at the same time**, by calling the PATCH endpoint with both `locale` and `currency`:

```typescript
// inside updateLocale, in the PATCH body:
body: JSON.stringify({ locale, currency: LOCALE_CURRENCY[locale] ?? 'GBP' }),
```

And set the currency cookie:
```typescript
cookieStore.set('currency', LOCALE_CURRENCY[locale] ?? 'GBP', { path: '/', sameSite: 'lax' });
```

### 10. New component — `frontend/components/events/pending-costs.tsx`

`'use client'` — used in the **add form** (local state only, flushed on submit). Mirrors `pending-links.tsx`.

```typescript
export type PendingCost = { label: string; amount: number; currency: string };

export const addPendingCost = (costs: PendingCost[], cost: PendingCost): PendingCost[] => ...
export const removePendingCost = (costs: PendingCost[], index: number): PendingCost[] => ...

type Props = {
  preferredCurrency: string;
  onChange: (costs: PendingCost[]) => void;
};

export const PendingCosts = ({ preferredCurrency, onChange }: Props) => { ... }
```

Internal state: `costs: PendingCost[]`, `label: string`, `amount: string`, `currency: string` (defaults to `preferredCurrency`), `popoverOpen: boolean`.

Renders:
- "Costs" label
- Chip row: one chip per cost (`£2.50 Coffee` format), each with an × button
- "+ Add cost" dashed chip that opens a popover with: Label input, currency prefix select (GBP/EUR/USD), Amount input, Add button (disabled unless both label and amount are filled and amount > 0)
- Grouped totals badge (hidden if no costs)

Export a `groupedTotals(costs)` pure function and a `formatAmount(amount, currency)` pure function for use in tests and the view component.

### 11. New component — `frontend/components/events/event-costs.tsx`

`'use client'` — used in the **edit form** (saves immediately per entry). Mirrors `event-links.tsx`.

```typescript
type Props = {
  eventId: number;
  initialCosts: EventCost[];
  readOnly?: boolean;
  preferredCurrency: string;
  onCostsChange?: (costs: EventCost[]) => void;
};

export const EventCosts = ({ eventId, initialCosts, readOnly = false, preferredCurrency, onCostsChange }: Props) => { ... }
```

Same chip UI as `PendingCosts`. On add: calls `addEventCost` server action, updates local `costs` state. On delete: calls `deleteEventCost`, filters local state. Shows `isAdding` loading state on the Add button.

### 12. Settings page — `frontend/app/(app)/settings/page.tsx`

Add a new **Currency** section between Language and Calendars, using the exact same button-picker pattern:

```tsx
<div className='space-y-2'>
  <h3 className='text-sm font-medium'>{t('currency.title')}</h3>
  <div className='flex gap-2'>
    {CURRENCIES.map(({ code, label }) => (
      <button
        key={code}
        onClick={() => updateCurrency(code)}
        className={cn(
          'flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors',
          mounted && currency === code
            ? 'border-foreground bg-accent text-accent-foreground'
            : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        {label}
      </button>
    ))}
  </div>
  <p className='text-xs text-muted-foreground'>{t('currency.hint')}</p>
</div>
```

`CURRENCIES = [{ code: 'GBP', label: '£ GBP' }, { code: 'EUR', label: '€ EUR' }, { code: 'USD', label: '$ USD' }]`

Read the `currency` cookie with `useLocale`-equivalent: read the `currency` cookie on mount via a `useEffect` + `document.cookie` parse, or pass it as a server-side prop from the page. The simplest approach: read the `currency` cookie in the server component wrapper and pass as `initialCurrency` prop to a client settings component — same as how the locale is already handled.

### 13. Thread `preferredCurrency` into forms

The calendar page (`frontend/app/(app)/calendars/[uuid]/page.tsx`) is a server component. Read the `currency` cookie there and pass it to the components that need it:

```typescript
const cookieStore = await cookies();
const preferredCurrency = cookieStore.get('currency')?.value ?? 'GBP';
```

Pass `preferredCurrency` as a prop to `EventAddForm` and wherever `EventEditForm` is instantiated. Both forms forward it to `PendingCosts` / `EventCosts`.

### 14. Update `frontend/components/event-add-form.tsx`

- Add `preferredCurrency: string` to `EventAddFormProps`
- Add a `pendingCostsRef = useRef<PendingCost[]>([])` (same pattern as `pendingUrlsRef`)
- Render `<PendingCosts preferredCurrency={preferredCurrency} onChange={(c) => { pendingCostsRef.current = c; }} />` after `<PendingLinks>`, before the Colour field, with a `<Separator className='my-5' />` above it if inside the same Links+Costs block, or keep the existing separators and place Costs immediately after Links
- After `createEvent` succeeds, fire `Promise.allSettled(pendingCostsRef.current.map(c => addEventCost(created.id, c.label, c.amount, c.currency)))` alongside the existing link creation
- Reset `pendingCostsRef.current = []` in the `useEffect` that resets the form

### 15. Update `frontend/components/event-edit-form.tsx`

- Add `preferredCurrency: string` to props (passed from wherever `EventEditForm` is used)
- Add `currentCostsRef = useRef<EventCost[]>(event?.costs ?? [])`, reset in `useEffect` on event change
- Render `<EventCosts eventId={Number(event?.id)} initialCosts={event?.costs ?? []} readOnly={readOnly} preferredCurrency={preferredCurrency} onCostsChange={(c) => { currentCostsRef.current = c; }} />` after `<EventLinks>`, with a `<Separator className='my-5' />` between them if needed

### 16. Update `frontend/components/event-view.tsx`

Display costs read-only using the `groupedTotals` and `formatAmount` utilities exported from `pending-costs.tsx`:

```tsx
{event?.costs && event.costs.length > 0 && (
  <>
    <tr>
      <th>Costs:</th>
      <td>
        <div className='flex flex-wrap gap-1.5'>
          {event.costs.map((c) => (
            <span key={c.id} className='inline-flex items-center text-xs rounded-full border bg-muted px-2.5 py-1 font-medium'>
              {formatAmount(c.amount, c.currency)} {c.label}
            </span>
          ))}
        </div>
        <p className='text-xs text-muted-foreground mt-1'>
          {groupedTotals(event.costs).map(([code, total]) => formatAmount(total, code)).join(' · ')}
        </p>
      </td>
    </tr>
  </>
)}
```

### 17. Update FullCalendar event type — `frontend/utils/data.ts`

Add `costs: EventCost[]` to `CalendarEvent` type.

### 18. Update events context — `frontend/context/events-context.tsx`

Where events are mapped/processed, pass `costs` through (same as `links`).

### 19. i18n — `frontend/messages/*.json`

Add to all four locale files (`en`, `es`, `pt`, `de`):

```json
{
  "eventCosts": {
    "title": "Costs",
    "labelPlaceholder": "Label (e.g. Coffee)",
    "amountPlaceholder": "0.00",
    "add": "Add",
    "adding": "Adding...",
    "deleteCost": "Remove cost entry"
  },
  "settings": {
    "currency": {
      "title": "Currency",
      "hint": "Default currency used when adding cost entries to events."
    }
  }
}
```

---

## Tests

### NEW: `backend/tests/integration/test_event_costs.py`

Mirror `test_event_links.py` exactly. Add an `event` fixture (same as in `test_event_links.py` — creates an event, cleans up costs + event after each test; costs are CASCADE-deleted so the cleanup only needs to delete the event row itself).

```
class TestCreateEventCost:
    test_returns_201_with_correct_fields          # label, amount, currency, event_id
    test_non_member_cannot_add_cost               # 403
    test_requires_auth                            # 403
    test_returns_404_for_unknown_event            # 404
    test_rejects_zero_amount                      # 400 or DB constraint error → 500 guard with a CHECK
    test_rejects_negative_amount                  # same

class TestDeleteEventCost:
    test_returns_204_on_success
    test_returns_404_for_unknown_cost
    test_non_member_cannot_delete_cost            # 403

class TestCostsInEventResponse:
    test_get_event_returns_empty_costs_by_default # costs == []
    test_get_event_returns_costs_after_adding     # costs == [{label, amount, currency, ...}]
    test_multiple_currencies_returned_correctly   # add GBP + EUR cost, verify both in response
```

### EXISTING: `backend/tests/integration/test_event_links.py` — no changes needed

Adding `costs: []` to `EventResponse` is additive. All existing assertions on `links` still pass.

### EXISTING: `backend/tests/integration/test_users.py` — add one test

Add a test to `TestUpdateUser` (or equivalent class) verifying that `PATCH /users/{id}` with `{ "currency": "EUR" }` updates the field and returns it in the response.

### NEW: `frontend/components/events/pending-costs.test.ts`

Mirror `pending-links.test.ts`. Test every exported pure function:

```
describe('addPendingCost')
  it('adds a new entry')
  it('does not add when label is empty')
  it('does not add when amount is zero')
  it('does not add when amount is negative')
  it('does not mutate the original array')

describe('removePendingCost')
  it('removes entry at given index')
  it('returns same array when index out of range')
  it('does not mutate the original array')

describe('groupedTotals')
  it('returns empty array for no entries')
  it('sums entries with the same currency')
  it('returns one entry per currency when currencies differ')
  it('rounds to two decimal places')

describe('formatAmount')
  it('formats GBP with £ symbol')
  it('formats EUR with € symbol')
  it('formats USD with $ symbol')
  it('falls back to currency code for unknown currency')
```

### EXISTING: `frontend/components/events/pending-links.test.ts` — no changes needed

### NEW: `frontend/e2e/10-cost-entries.spec.ts`

Follow the same structure as `8-event-links.spec.ts`. Use `createCalendar`, `createEvent`, `getCalendarId`, `getToken`, `deleteCalendar` from `./helpers/api`. Add a `createEventCost` helper (see below).

```
test.describe('@10. cost entries')

  @10.1 should add a cost entry to an event and display it as a chip
        // open edit popup → fill label + amount → click Add → chip appears with correct text

  @10.2 should delete a cost entry from an event
        // create cost via API helper → open edit popup → click × → chip disappears

  @10.3 should show grouped totals when entries span multiple currencies
        // add GBP cost via API, add EUR cost via API → open edit popup
        // verify totals badge shows "£X.XX · €Y.YY"

  @10.4 should persist cost entries after saving and reopening the event
        // add cost in edit popup → save → reopen → chip still present

  @10.5 should add costs when creating an event
        // open add-event popup → fill title + add cost → submit
        // reopen event → cost chip visible

  @10.6 should show cost chips on a public calendar (read-only, no controls)
        // create cost via API → make calendar public → open in incognito/new context
        // chip visible, "Add cost" dashed chip absent
```

### EXISTING: `frontend/e2e/6-settings.spec.ts` — add two tests

```
  @6.4 should show the Currency section on the Settings page
        await page.goto('/settings')
        await expect(page.getByRole('heading', { name: 'Currency' })).toBeVisible()
        await expect(page.getByRole('button', { name: /GBP/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /EUR/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /USD/i })).toBeVisible()

  @6.5 should update the preferred currency
        await page.goto('/settings')
        await page.getByRole('button', { name: /EUR/i }).click()
        // active state applied
        await expect(page.getByRole('button', { name: /EUR/i }))
          .toHaveClass(/border-foreground/)
        // reset back to GBP to avoid polluting other tests
        await page.getByRole('button', { name: /GBP/i }).click()
```

### UPDATE: `frontend/e2e/helpers/api.ts` — add `createEventCost`

```typescript
export const createEventCost = async (
  request: APIRequestContext,
  token: string,
  eventId: number,
  label: string,
  amount: number,
  currency: string,
): Promise<number> => {
  const res = await request.post(`${API_URL}/api/events/${eventId}/costs`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { label, amount, currency },
  });
  const { id } = await res.json() as { id: number };
  return id;
};
```

Also update the `login` helper to reset the `currency` cookie to `'GBP'` alongside the existing locale reset, to prevent `@6.5` from polluting subsequent tests:

```typescript
await page.context().addCookies([
  { name: 'locale',   value: 'en',  domain: 'localhost', path: '/' },
  { name: 'currency', value: 'GBP', domain: 'localhost', path: '/' },  // ← add
]);
```

---

## Verification checklist

1. Run `backend/migrations/add_event_costs.sql` against local DB
2. `make check` in `backend/`
3. `npm run build && npm run lint && npm run check` in `frontend/`
4. Manually: add event with costs → verify chips, totals, DB rows; edit event → add/delete cost; view public calendar → costs visible, no controls; Settings → change currency → reopen add form → correct default
