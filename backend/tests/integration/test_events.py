from app.crud.events import create_event
from app.schemas.event import EventCreate


def _make_event(db_conn, calendar: dict, title: str) -> dict:
    return create_event(
        db_conn,
        EventCreate(calendar_id=calendar["id"], title=title, date="2035-06-01", start_time="10:00"),
    )


class TestListAllEvents:
    def test_requires_auth(self, client):
        res = client.get("/api/events/")
        assert res.status_code == 401

    def test_returns_events_from_calendars_the_user_belongs_to(self, client, db_conn, calendar, owner_headers):
        event = _make_event(db_conn, calendar, "Owner's event")

        res = client.get("/api/events/", headers=owner_headers)

        assert res.status_code == 200
        assert event["id"] in [e["id"] for e in res.json()]

    def test_does_not_return_events_from_other_users_calendars(self, client, db_conn, calendar, other_headers):
        # Regression: this endpoint used to return every user's events, private calendars included
        event = _make_event(db_conn, calendar, "Private event")

        res = client.get("/api/events/", headers=other_headers)

        assert res.status_code == 200
        assert event["id"] not in [e["id"] for e in res.json()]
