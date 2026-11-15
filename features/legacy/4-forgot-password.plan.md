# Forgot Password — Implementation Plan

## Flow

1. User clicks "Forgot your password?" on `/login`
2. User enters their email on `/forgot-password`
3. Backend creates a reset token, stores it with an expiry, and sends an email via Resend
4. User clicks the link in the email → lands on `/reset-password?token=<token>`
5. User enters and confirms a new password
6. Backend verifies the token (exists, not expired, not used), updates the password hash, marks the token as used
7. User is redirected to `/login`

---

## Backend

### 1. Migration — `password_reset_tokens` table

New file: `backend/migrations/add_password_reset_tokens.sql`

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id        SERIAL PRIMARY KEY,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token     VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
```

Also add the `CREATE TABLE` block to `backend/init.sql`.

Token: 32 random bytes → hex string (64 chars), generated with `secrets.token_hex(32)`.  
Expiry: 1 hour from creation.

---

### 2. `backend/app/crud/users.py`

Add:

```python
def create_password_reset_token(db, user_id: int, token: str, expires_at: datetime) -> None
def get_password_reset_token(db, token: str) -> dict | None   # returns row or None
def mark_token_used(db, token: str) -> None
def update_user_password(db, user_id: int, password_hash: str) -> None
```

---

### 3. `backend/app/email.py`

Add:

```python
def send_password_reset_email(to_email: str, reset_url: str) -> None
```

Email body: plain link — "Click here to reset your password: <reset_url>"  
`reset_url` = `{app_base_url}/reset-password?token={token}`

---

### 4. `backend/app/routers/auth.py` (new file) or add to existing auth router

Two new endpoints:

#### `POST /api/auth/forgot-password`
- Body: `{ email: str }`
- Looks up the user by email
- If user not found: return `200` with generic message (don't reveal whether email exists)
- If found: generate token, insert into `password_reset_tokens`, send email
- Returns: `{ message: "If that email is registered, a reset link has been sent." }`

#### `POST /api/auth/reset-password`
- Body: `{ token: str, password: str }`
- Look up token row — if not found or expired or already used → `400 Invalid or expired token`
- Hash the new password with bcrypt
- Call `update_user_password` and `mark_token_used` in a single transaction
- Returns: `200 { message: "Password updated" }`

Register the router in `backend/app/main.py` under `/api/auth` (or merge into existing auth router if one exists).

---

## Frontend

### 1. `/forgot-password` page

File: `frontend/app/(marketing)/forgot-password/page.tsx`

- Client component (`'use client'`)
- Single email input + submit button
- On success: show inline message "If that email is registered, a reset link has been sent." (same message regardless of outcome)
- Server action in `frontend/app/auth/actions.ts`:
  ```ts
  export async function requestPasswordReset(
    _prev: AuthState, formData: FormData
  ): Promise<AuthState>
  ```
  Calls `POST /api/auth/forgot-password`.

---

### 2. `/reset-password` page

File: `frontend/app/(marketing)/reset-password/page.tsx`

- Client component, reads `?token=` from `useSearchParams()`
- Two inputs: new password + confirm password (client-side match validation)
- On success: redirect to `/login`
- On error (invalid/expired token): show error message
- Server action in `frontend/app/auth/actions.ts`:
  ```ts
  export async function resetPassword(
    _prev: AuthState, formData: FormData
  ): Promise<AuthState>
  ```
  Calls `POST /api/auth/reset-password` with `{ token, password }`.

---

## Files to create / modify

| File | Action |
|------|--------|
| `backend/migrations/add_password_reset_tokens.sql` | Create |
| `backend/init.sql` | Add table + index |
| `backend/app/crud/users.py` | Add 4 helpers |
| `backend/app/crud/__init__.py` | Export new helpers |
| `backend/app/email.py` | Add `send_password_reset_email` |
| `backend/app/routers/auth.py` | Create (or extend) with 2 endpoints |
| `backend/app/main.py` | Register auth router if new file |
| `frontend/app/(marketing)/forgot-password/page.tsx` | Create |
| `frontend/app/(marketing)/reset-password/page.tsx` | Create |
| `frontend/app/auth/actions.ts` | Add 2 server actions |

---

## Security notes

- Token is single-use: marked `used_at` immediately on successful reset
- Expiry is 1 hour
- Email enumeration is avoided: always return the same generic message
- Password validation: minimum 8 characters (same rule as signup)
- Bcrypt hashing: same approach as signup (`pwd_context.hash`)
