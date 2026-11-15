# Feedback & Wishlist — Implementation Plan

## Flow

- A megaphone icon button appears in the top bar (next to `⋮`), visible to all users but disabled for unauthenticated ones
- Clicking it navigates to `/feedback`
- The page has two sections:
  1. **Feedback** — free-text textarea (max 500 chars), submit sends to backend, textarea clears and a toast appears
  2. **Wishlist** — table listing seeded features with a thumbs-up vote button per row; clicking toggles the vote on/off

---

## Backend

### 1. DB tables

**Migration:** `backend/migrations/add_feedback.sql`  
Also add to `backend/init.sql`.

```sql
CREATE TABLE feedback (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist_votes (
    wishlist_id INTEGER NOT NULL REFERENCES wishlist(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (wishlist_id, user_id)
);
```

**Seed data** (inserted in migration and init.sql):

| Title | Description |
|-------|-------------|
| Recurring events | Create events that repeat daily, weekly, or monthly |
| Calendar sharing via link | Share a read-only view of a calendar with a public link |
| Event reminders | Receive email or push notifications before an event |
| Trip budget tracker | Attach a budget to a calendar and track expenses per event |
| Collaborative availability | Show when all calendar members are free to plan group events |
| Import/export (iCal) | Import and export calendars in iCal format for use with other apps |

---

### 2. `backend/app/crud/feedback.py` (new file)

```python
def submit_feedback(db, user_id: int, content: str) -> dict
def get_wishlist(db, user_id: int) -> list[dict]
  # returns rows with: id, title, description, vote_count, user_has_voted
def add_vote(db, wishlist_id: int, user_id: int) -> None
def remove_vote(db, wishlist_id: int, user_id: int) -> None
```

---

### 3. `backend/app/crud/__init__.py`

Export the 4 new functions.

---

### 4. Sanitization

In the `POST /api/feedback` endpoint, strip HTML tags from the content before storing.  
Use a simple regex replace: `re.sub(r'<[^>]+>', '', content)`.  
Max length enforced at the Pydantic schema level (500 chars).

---

### 5. `backend/app/schemas/feedback.py` (new file)

```python
class FeedbackCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

class WishlistItemResponse(BaseModel):
    id: int
    title: str
    description: str
    vote_count: int
    user_has_voted: bool

class MessageResponse(BaseModel):  # reuse from auth schemas if preferred
    message: str
```

---

### 6. `backend/app/routers/feedback.py` (new file)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/feedback` | required | Submit feedback |
| `GET` | `/api/wishlist` | required | List features with vote counts |
| `POST` | `/api/wishlist/{id}/vote` | required | Add vote |
| `DELETE` | `/api/wishlist/{id}/vote` | required | Remove vote |

`POST /api/feedback` strips tags from content, stores it, returns `{ message: "Thank you for your feedback!" }`.  
`POST` and `DELETE` vote endpoints are idempotent (no error if already voted / not voted).

---

### 7. `backend/app/routers/__init__.py` + `main.py`

Register the new router:
- `feedback_router` under `/api` (feedback and wishlist are top-level, not nested under a single prefix)

Or use two separate prefixes:
- `/api/feedback`
- `/api/wishlist`

---

## Frontend

### 1. Top bar — `components/top-bar.tsx`

Add a `Megaphone` icon button to the left of the `⋮` button:
- `asChild` with a `Link` to `/feedback`
- `disabled` + `pointer-events-none opacity-40` when `!isLoggedIn`

---

### 2. `/feedback` page — `app/(app)/feedback/page.tsx`

Server component. Fetches feature requests (with vote state) server-side.  
Renders two client components:
- `<FeedbackForm />` — the free-text section
- `<Wishlist />` — the voting table

---

### 3. `components/feedback/feedback-form.tsx` (new)

- Client component
- `<Textarea>` with `maxLength={500}` and a character counter (`x / 500`)
- Submit calls `submitFeedback` server action
- On success: clears textarea, shows toast "Feedback sent. Thank you"
- Submit button disabled while pending or textarea empty

---

### 4. `components/feedback/wishlist.tsx` (new)

- Client component
- Table with columns: **Feature**, **Description**, **Votes**
- Vote column: `ThumbsUp` icon button showing the total vote count next to it
  - Filled/coloured when `user_has_voted`, outline when not
  - Clicking toggles the vote via server action, with optimistic update
- Disabled while a toggle is pending

---

### 5. Server actions — `app/(app)/feedback/actions.ts` (new file)

```ts
export async function submitFeedback(content: string): Promise<void>
export async function toggleVote(wishlistId: number, userHasVoted: boolean): Promise<void>
  // userHasVoted=true → DELETE (remove), false → POST (add)
```

---

## Files to create / modify

| File | Action |
|------|--------|
| `backend/migrations/add_feedback.sql` | Create |
| `backend/init.sql` | Add tables + seed data |
| `backend/app/crud/feedback.py` | Create |
| `backend/app/crud/__init__.py` | Export new functions |
| `backend/app/schemas/feedback.py` | Create |
| `backend/app/routers/feedback.py` | Create |
| `backend/app/routers/__init__.py` | Export new router |
| `backend/app/main.py` | Register new router(s) |
| `frontend/components/top-bar.tsx` | Add megaphone button |
| `frontend/app/(app)/feedback/page.tsx` | Create |
| `frontend/components/feedback/feedback-form.tsx` | Create |
| `frontend/components/feedback/wishlist.tsx` | Create |
| `frontend/app/(app)/feedback/actions.ts` | Create |
