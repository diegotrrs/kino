import os
from uuid import uuid4

import psycopg2
import pytest
from fastapi.testclient import TestClient
from psycopg2.extras import RealDictCursor

from app.auth import create_access_token
from app.crud.calendars import create_calendar
from app.crud.test import delete_user
from app.crud.users import create_user
from app.database import get_db
from app.main import app
from app.schemas.calendar import CalendarCreate
from app.schemas.user import UserCreate

_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/kino")


@pytest.fixture(scope="session")
def db_conn():
    """Single DB connection shared across all integration tests in the session."""
    conn = psycopg2.connect(_DATABASE_URL, cursor_factory=RealDictCursor)
    yield conn
    conn.close()


@pytest.fixture
def client(db_conn):
    """TestClient with get_db overridden to use the test DB connection."""
    app.dependency_overrides[get_db] = lambda: (yield db_conn)
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def owner(db_conn):
    """A real user in the DB who will act as calendar owner. Cleaned up after each test."""
    unique = uuid4().hex[:8]
    user = create_user(
        db_conn,
        UserCreate(name="Test Owner", email=f"owner.{unique}@test.example", password="testpw123"),
    )
    yield user
    delete_user(db_conn, user["id"])


@pytest.fixture
def owner_headers(owner):
    token = create_access_token({"sub": str(owner["id"])})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_user(db_conn):
    """A second real user in the DB. Cleaned up after each test."""
    unique = uuid4().hex[:8]
    user = create_user(
        db_conn,
        UserCreate(name="Other User", email=f"other.{unique}@test.example", password="testpw123"),
    )
    yield user
    delete_user(db_conn, user["id"])


@pytest.fixture
def other_headers(other_user):
    token = create_access_token({"sub": str(other_user["id"])})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def calendar(db_conn, owner):
    """A calendar owned by `owner`, created directly via CRUD. Cleaned up after each test."""
    cal = create_calendar(db_conn, CalendarCreate(name="Test Calendar", created_by=owner["id"]))
    yield cal
    # Clean up regardless of whether the test soft-deleted the calendar
    with db_conn.cursor() as cur:
        cur.execute("DELETE FROM events WHERE calendar_id = %s", (cal["id"],))
        cur.execute("DELETE FROM calendar_users WHERE calendar_id = %s", (cal["id"],))
        cur.execute("DELETE FROM calendars WHERE id = %s", (cal["id"],))
        cur.execute("DELETE FROM deleted_calendar_day_names WHERE calendar_id = %s", (cal["id"],))
        cur.execute("DELETE FROM deleted_calendars WHERE id = %s", (cal["id"],))
        db_conn.commit()


@pytest.fixture
def track_calendar(db_conn):
    """
    Factory fixture for tests that create calendars via the API.
    Call track_calendar(id) after each POST to register it for cleanup.

    Usage:
        def test_something(self, client, owner_headers, track_calendar):
            res = client.post("/api/calendars/", ...)
            track_calendar(res.json()["id"])
    """
    ids: list[int] = []
    yield ids.append
    for cal_id in ids:
        with db_conn.cursor() as cur:
            cur.execute("DELETE FROM events WHERE calendar_id = %s", (cal_id,))
            cur.execute("DELETE FROM calendar_users WHERE calendar_id = %s", (cal_id,))
            cur.execute("DELETE FROM calendars WHERE id = %s", (cal_id,))
            cur.execute("DELETE FROM deleted_calendars WHERE id = %s", (cal_id,))
            db_conn.commit()
