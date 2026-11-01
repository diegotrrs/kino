# Python Coding Standards

## 1. Formatter & Linter

This project uses **Ruff** for both formatting and linting. Configuration is in `ruff.toml`.

- Line length: **88 characters**
- Target Python version: **3.12**
- Quote style: **double quotes**

Run before committing:

```bash
ruff format .
ruff check .
```

---

## 2. Naming Conventions

| Thing         | Convention         | Example                                |
| ------------- | ------------------ | -------------------------------------- |
| Variables     | `snake_case`       | `user_id`, `calendar_name`             |
| Functions     | `snake_case`       | `get_user()`, `create_calendar()`      |
| Classes       | `PascalCase`       | `CalendarResponse`, `UserCreate`       |
| Constants     | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_CONTENT_LENGTH`   |
| Modules/files | `snake_case`       | `crud/calendars.py`, `schemas/auth.py` |
| Type aliases  | `PascalCase`       | `UserId = int`                         |

---

## 3. Type Hints

Always annotate function signatures — parameters and return types.

```python
# Good
def get_user(db: connection, user_id: int) -> dict | None:
    ...

# Bad
def get_user(db, user_id):
    ...
```

Use the modern union syntax (`X | Y`) over `Optional[X]` or `Union[X, Y]`:

```python
# Good
def get_calendar(db: connection, user_id: int | None = None) -> dict | None:

# Bad
from typing import Optional
def get_calendar(db: connection, user_id: Optional[int] = None) -> Optional[dict]:
```

---

## 4. Imports

Imports are auto-sorted by Ruff (`isort` rules). The order is:

1. Standard library
2. Third-party packages
3. Local imports

```python
# Standard library
import re
import secrets
from datetime import datetime, timedelta, timezone

# Third-party
from fastapi import APIRouter, Depends, HTTPException
from psycopg2.extensions import connection

# Local
from ..auth import get_current_user
from .. import crud
from ..database import get_db
```

Never use wildcard imports:

```python
# Bad
from .models import *
```

---

## 5. Functions

- Keep functions short and focused — one responsibility per function
- Prefer explicit `return` types
- Avoid mutable default arguments

```python
# Bad
def add_item(items=[]):
    items.append(1)
    return items

# Good
def add_item(items: list | None = None) -> list:
    if items is None:
        items = []
    items.append(1)
    return items
```

---

## 6. Database (psycopg2)

- Always use **parameterized queries** — never concatenate user input into SQL strings
- Always use the `with db.cursor() as cur:` context manager
- Call `db.commit()` after every write; call `db.rollback()` on failure when inside a multi-step transaction

```python
# Good
def get_user(db: connection, user_id: int) -> dict | None:
    with db.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cur.fetchone()

# Bad — SQL injection risk
def get_user(db, user_id):
    with db.cursor() as cur:
        cur.execute(f"SELECT * FROM users WHERE id = {user_id}")
        return cur.fetchone()
```

- No ORM (SQLAlchemy or similar) — raw SQL only, per project rules

---

## 7. FastAPI Specifics

- Use `Depends()` for dependency injection (db, current user)
- Use Pydantic models for all request bodies and responses
- Return meaningful HTTP status codes — don't return `200` for everything
- Use `response_model` on every endpoint to ensure the response is validated and serialised correctly

```python
@router.post("/", response_model=CalendarResponse, status_code=201)
def create_calendar(
    calendar: CalendarCreate,
    db: connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    ...
```

- Route path params use `snake_case`: `/{calendar_uuid}`, `/{user_id}`

---

## 8. Error Handling

- Use `HTTPException` for all API errors — don't let internal exceptions bubble up to the client
- Use specific status codes: `400` bad input, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict

```python
if user is None:
    raise HTTPException(status_code=404, detail="User not found")
```

- For best-effort operations (e.g. sending email), catch broadly and log — don't let them fail the request:

```python
try:
    send_invite_email(to_email=email)
except Exception:
    logger.exception("Failed to send email to %s", email)
```

---

## 9. Security

- **Passwords** — always hashed with bcrypt via `passlib`. Never store plain text
- **SQL injection** — prevented by parameterized queries (see section 6)
- **User input** — strip HTML tags from free-text fields before storing: `re.sub(r'<[^>]+>', '', text)`
- **Auth** — use `get_current_user` dependency for protected endpoints; `get_optional_user` for endpoints that work with or without a session
- **Secrets** — never hardcode secrets; use environment variables via `pydantic-settings`

---

## 10. Pydantic Models

- Define separate models for create, update, and response — don't reuse the same model for all three
- Use `model_dump(exclude_unset=True)` for PATCH operations so only provided fields are updated
- Set sensible defaults; use `Field(...)` for required fields with constraints

```python
class FeedbackCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

class CalendarUpdate(BaseModel):
    name: str | None = None
    is_public: bool | None = None
```

---

## 11. Logging

Use the standard `logging` module — never use `print()` in production code.

```python
import logging

logger = logging.getLogger(__name__)

# Usage
logger.info("User %s logged in", user_id)
logger.exception("Failed to send email to %s", email)  # includes traceback
```

---

## 12. Testing

### Unit vs integration

| | Unit (`tests/unit`) | Integration (`tests/integration`) |
|---|---|---|
| Tests | Branching logic: permissions, validation, error mapping, token expiry, string building | That SQL does what it claims: joins, `ON CONFLICT`, soft delete/restore, cascades |
| Database | None — patch `crud`, `get_settings`, `resend` | Real Postgres (`DATABASE_URL`) |
| Runs in CI | Yes, with coverage | Locally via `make check` |

Rule of thumb: **if a function has an `if`, it deserves a unit test; if it only has SQL, it deserves an integration test.** Don't unit-test SQL by asserting on query strings beyond what the function itself builds dynamically.

### Router tests

Routers are plain functions, so call them directly instead of going through HTTP:

```python
@patch("app.routers.events.crud")
def test_non_member_cannot_delete_event(mock_crud, db, user):
    mock_crud.get_event.return_value = {"id": 5, "calendar_id": 9}
    mock_crud.get_user_role.return_value = None

    with pytest.raises(HTTPException) as exc:
        delete_event(event_id=5, db=db, current_user=user)

    assert exc.value.status_code == 403
    mock_crud.delete_event.assert_not_called()
```

- On every rejection path, **assert the mutating crud call was not made** — that is the security property, not the status code.
- Use `pytest.mark.parametrize` for permission matrices (roles × handlers) instead of copy-pasting near-identical tests.

### Fixtures and helpers

- Shared fixtures (`user`, `db`) live in `tests/unit/conftest.py`.
- Shared helpers (`make_mock_db`, `mock_settings`) live in `tests/unit/helpers.py`.
- Integration fixtures live in `tests/conftest.py`.

### Time

Never depend on wall-clock time. Pin it with the `time_machine` fixture:

```python
@pytest.fixture(autouse=True)
def _frozen_clock(self, time_machine):
    time_machine.move_to(NOW, tick=False)
```

### Known bugs

A bug that is understood but not yet fixed gets a test marked `@pytest.mark.xfail(strict=True, reason="Bug: …")`. It documents the expected behaviour, and `strict=True` turns it into a failure once the bug is fixed, so the marker gets removed.

### Naming

Group by unit under test with `class TestThing:` and name methods after the behaviour, not the implementation: `test_non_member_cannot_delete_event`, not `test_get_user_role_returns_none`.
