# Backend unit testing — suggestions

Where the backend's unit tests stand today, what is worth testing next, and how to structure it. Written after reading every router, schema, and the auth/email/database modules.

> **Status (implemented on `test/backend-unit-tests`):** §3.1–3.7 and §4 are done — 182 unit tests plus 8 `xfail(strict=True)` tests documenting open bugs. Bugs **#1, #2, #3 are fixed**. Bugs #4–#9 need a product decision and are tracked by the `xfail` tests (see `pytest -rx`). Testing conventions now live in `coding-standards.md` §12.

---

## 0. Bugs found while reviewing (fix these first)

Reading the code to plan tests surfaced real defects. Each one should get a failing test **before** it is fixed, so it cannot regress.

| # | Severity | Where | Problem |
|---|---|---|---|
| 1 | **Critical — data leak** | `routers/events.py` `list_events` → `crud.get_events` | `GET /api/events/` without `calendar_uuid` returns **every event in the database**, from every user and every private calendar. `get_events` has no user filter. The frontend `/events` page calls exactly this endpoint, so in production each user's Events page lists other people's events. |
| 2 | High | `email.py` `send_calendar_invite_email` | `inviter_name` and `calendar_name` are user-controlled and interpolated into the email HTML unescaped. A calendar named `<a href="https://evil">Click to verify</a>` is rendered as a link in an email sent from Kino's domain. Use `html.escape`. |
| 3 | Medium | `schemas/calendar.py` `CalendarExpenseCreate` | No `amount > 0` validator (unlike `EventExpenseCreate`). A zero/negative amount hits the DB `CHECK` constraint and returns a 500 instead of a 422. |
| 4 | Medium | `schemas/*` currency fields | `currency` is a free `str`, but the column is `VARCHAR(3)`. `"EURO"` → DB error → 500. Same for `UserUpdate.currency` and `locale`. |
| 5 | Medium | `routers/calendars.py` `remove_calendar_user` | The owner can remove themselves, leaving a calendar with no owner that nobody can edit, share, or delete. |
| 6 | Medium | `routers/users.py` `update_user` | Changing `email` to one that already exists raises a unique-violation → 500 instead of 409. |
| 7 | Low | `schemas/auth.py` | No minimum password length on `SignupRequest` / `ResetPasswordRequest` — `""` is accepted. |
| 8 | Low | `schemas/event.py` | Nothing stops `end_date`/`end_time` from being before the start. |
| 9 | Low | `config.py` | `env` defaults to `"development"`, so the `/api/test` router is mounted unless production explicitly sets `ENV=production`. It is still guarded by `TEST_RESET_SECRET`, but the safe default is the reverse. |

---

## 1. Current state

| | Unit (`tests/unit`) | Integration (`tests/integration`) |
|---|---|---|
| Files | `test_auth.py`, `test_feedback.py` | calendars, users, events links/expenses, calendar expenses |
| Tests | 29 | 60 |
| Runs in CI | ✅ | ❌ (needs Postgres) |
| Covers | password hashing, JWT, `get_current_user`, `get_optional_user`, `_strip_tags` | HTTP flows against a real DB |

Unit coverage is concentrated on `auth.py`. **The routers — where all authorization decisions live — have no unit tests at all.** That is the biggest gap, and bug #1 above is exactly the kind of thing it lets through.

---

## 2. What makes a good unit test here

The codebase is already well-shaped for unit testing: routers are thin functions that take `db` and `current_user` as arguments and delegate to `crud`. That means a route handler can be called **directly as a Python function**, with `crud` patched — no HTTP, no database, milliseconds per test.

**Unit test** (this doc): branching logic — permission checks, validation, error mapping, token expiry, string building. Mock `crud`, `get_settings`, `resend`.

**Integration test** (keep in `tests/integration`): that the SQL actually does what it claims — joins, `ON CONFLICT`, soft delete/restore, cascade cleanup. Do not try to unit-test SQL by asserting on query strings; that only re-states the implementation.

Rule of thumb: *if the function has an `if`, it deserves a unit test; if it only has SQL, it deserves an integration test.*

---

## 3. Suggested tests, in priority order

### 3.1 Router authorization (highest value)

Every protected endpoint follows the same pattern: resolve the resource → 404 if missing → check role → 403 if not allowed → call crud. Test each branch.

**Pattern:**

```python
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.routers.events import delete_event

USER = {"id": 1, "name": "Ana"}


@patch("app.routers.events.crud")
def test_delete_event_returns_404_when_event_missing(mock_crud):
    mock_crud.get_event.return_value = None

    with pytest.raises(HTTPException) as exc:
        delete_event(event_id=5, db=object(), current_user=USER)

    assert exc.value.status_code == 404
    mock_crud.delete_event.assert_not_called()


@patch("app.routers.events.crud")
def test_delete_event_returns_403_when_not_a_member(mock_crud):
    mock_crud.get_event.return_value = {"id": 5, "calendar_id": 9}
    mock_crud.get_user_role.return_value = None

    with pytest.raises(HTTPException) as exc:
        delete_event(event_id=5, db=object(), current_user=USER)

    assert exc.value.status_code == 403
    mock_crud.delete_event.assert_not_called()
```

Always assert the mutating crud call was **not** made on the rejection paths — that is the actual security property.

**`tests/unit/test_events_router.py`**
- `list_events`
  - with `calendar_uuid`: 404 when calendar missing; 403 for private calendar + anonymous; 403 for private calendar + non-member; returns events for public calendar + anonymous; returns events for member
  - without `calendar_uuid`: 401 when anonymous; **only returns the current user's events** (fails today — bug #1)
- `get_event`, `update_event`, `delete_event`, link and expense create/delete: 404 missing event → 403 non-member → success path calls crud with the right ids
- `delete_event_link` / `delete_event_expense`: 404 when crud returns `False`

Many of these handlers share an identical 404/403 preamble, so use `pytest.mark.parametrize` over the handler functions rather than copy-pasting 8 near-identical tests.

**`tests/unit/test_calendars_router.py`**
- Owner-only actions (`update_calendar`, `delete_calendar`, `invite_user`, `add_calendar_user`, `remove_calendar_user`): parametrize over role `None` and `"editor"` → 403; `"owner"` → proceeds
- Member actions (`list_calendar_users`, `create/delete_calendar_expense`): `None` → 403; `"editor"` and `"owner"` → proceed
- `get_calendar` / `list_calendar_expenses`: same public/private/anonymous matrix as `list_events`
- `create_calendar`: sets `created_by` from `current_user`, ignoring any value in the body (prevents creating calendars on behalf of someone else)
- `invite_user`: an email failure (`send_calendar_invite_email` raising) still returns the member and logs (`caplog`)
- `remove_calendar_user`: owner removing themselves is rejected (bug #5)
- `_get_id_by_uuid`: raises 404 when no row

**`tests/unit/test_users_router.py`**
- `get_user`, `list_user_calendars`, `update_user`, `delete_user`: 403 when `user_id != current_user["id"]` — and crud not called
- `update_user`: passes only fields that were set (`exclude_unset`) — a body of `{"name": "x"}` must not null out `email`

**`tests/unit/test_feedback_router.py`**
- `submit_feedback`: content that is only tags (`"<p></p>"`) → 400; whitespace-only after stripping → 400; stored content is the stripped version

### 3.2 Password reset flow (`routers/auth.py`)

Security-sensitive and full of branches; currently untested at unit level.

- `forgot_password`
  - unknown email → generic message, **no** token created, **no** email sent (prevents account enumeration)
  - known email → token created with `expires_at` ≈ now + 1h; email sent with URL `{app_base_url}/reset-password?token=…`
  - email provider raising → still returns the generic message
  - response text is identical for known and unknown emails
- `reset_password`
  - unknown token → 400
  - already-used token → 400
  - expired token → 400 (pin time — see §4)
  - naive `expires_at` from the DB is treated as UTC
  - valid token → password updated with a hash (not the plain text), token marked used
- `login`: unknown email and wrong password produce the **same** 401 message
- `signup`: existing email → 409, `create_user` not called

### 3.3 Schemas (cheap, fast, catches bugs #3, #4, #7, #8)

**`tests/unit/test_schemas.py`** — instantiate models directly and assert `ValidationError`:
- `EventExpenseCreate`: `0` and negative rejected; positive accepted
- `CalendarExpenseCreate`: same (fails today — bug #3)
- `FeedbackCreate`: `""` rejected; 500 chars accepted; 501 rejected
- `EventUpdate` / `UserUpdate`: `model_dump(exclude_unset=True)` contains only provided fields
- Once validators are added: currency must be 3 uppercase letters; password minimum length; end not before start

### 3.4 Email (`email.py`)

Patch `app.email.resend` and assert on the payload passed to `resend.Emails.send`:
- reset email goes to the right address and contains the reset URL
- invite subject includes inviter and calendar names
- invite HTML **escapes** `<`/`>` in calendar and inviter names (fails today — bug #2)
- `resend.api_key` is set from settings

### 3.5 Test-only router (`routers/test.py`)

This endpoint deletes data, so its guards matter:
- 503 when `test_reset_secret` or `test_user_id` is unset
- 403 on wrong secret — and `reset_test_user_data` not called
- 429 on a second call within 5 s (patch `time.monotonic`)
- the router is not mounted when `env == "production"` (import `app.main` with patched settings)

### 3.6 Database connection helper (`database.py`)

`_get_live_conn` has real logic (stale-connection recovery for PgBouncer):
- healthy connection is returned as-is
- connection whose `SELECT 1` raises is returned to the pool with `close=True`, and a fresh one is fetched
- `get_db` always returns the connection to the pool, even when the request handler raises

### 3.7 Pure crud helpers

Most crud is SQL and belongs in integration tests, but two functions build SQL dynamically:
- `update_event` / `update_user` with an empty update → no `UPDATE` executed, current row returned
- the generated `SET` clause only includes provided keys

Note: `update_user` interpolates dict **keys** into SQL. Keys come from the Pydantic model today, so it is safe, but a unit test that `update_user` rejects/ignores unexpected keys would protect against a future caller passing raw request data.

---

## 4. Structure and tooling

### Shared fixtures — `tests/unit/conftest.py`

`make_mock_db` and `mock_settings` currently live inside `test_auth.py`. Move them to a `conftest.py` so every new file can use them:

```python
@pytest.fixture
def user() -> dict:
    return {"id": 1, "name": "Test User", "email": "test@example.com"}


@pytest.fixture
def settings(monkeypatch):
    s = Mock(
        jwt_secret_key="test-secret-key-long-enough-for-hs256",
        jwt_expiration_minutes=60,
        app_base_url="http://localhost:3000",
        resend_api_key="test",
        resend_from_email="Kino <test@example.com>",
        test_reset_secret="secret",
        test_user_id=1,
    )
    for module in ("app.auth", "app.routers.auth", "app.email", "app.routers.test"):
        monkeypatch.setattr(f"{module}.get_settings", lambda: s)
    return s
```

### Pin time

Token expiry and reset-link expiry depend on `datetime.now`. Tests like `test_expiration_matches_configured_minutes` work around it with ranges; prefer pinning. Either add `time-machine` (fast, no monkeypatching of the `datetime` class) or inject a clock. This matches the frontend standard (“pin time in date-dependent tests”).

### Parametrize the permission matrix

```python
@pytest.mark.parametrize("role", [None, "editor"])
@patch("app.routers.calendars._get_id_by_uuid", return_value=9)
@patch("app.routers.calendars.crud")
def test_delete_calendar_is_owner_only(mock_crud, _id, role, user):
    mock_crud.get_user_role.return_value = role
    with pytest.raises(HTTPException) as exc:
        delete_calendar("uuid", db=object(), current_user=user)
    assert exc.value.status_code == 403
    mock_crud.delete_calendar.assert_not_called()
```

### Coverage

Add `pytest-cov` and report it in CI so gaps are visible:

```
pytest tests/unit --cov=app --cov-report=term-missing
```

Start by **reporting** only. Once the router tests above exist, add `--cov-fail-under` at whatever the number lands on, so coverage can only go up.

### Naming

Keep the existing style — `class TestThing:` with `test_<behaviour>` methods — and name the behaviour, not the implementation: `test_non_member_cannot_delete_event`, not `test_get_user_role_none`.

### Add a testing section to `coding-standards.md`

The backend standards have no testing section (the frontend's does). Worth adding: unit vs integration rule from §2, fixture location, “assert the mutating call was not made on rejection paths”, and time pinning.

---

## 5. Suggested order of work

1. **Fix bug #1** with a failing unit test for `list_events` first, then filter `get_events` by membership.
2. `tests/unit/conftest.py` with shared fixtures.
3. Router authorization tests (§3.1) — the largest risk reduction per line of test.
4. Password reset flow (§3.2).
5. Schema tests + validators for bugs #3, #4, #7 (§3.3).
6. Email escaping test + fix for bug #2 (§3.4).
7. `pytest-cov` reporting in CI.
8. The rest (§3.5–3.7).

Steps 1–5 are roughly 80–100 small tests, all running in well under a second, and require no database.
