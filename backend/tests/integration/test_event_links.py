"""
Integration tests for the event links API.

These tests hit a real PostgreSQL database. Each test is isolated:
fixtures create the data they need and clean up after themselves.
"""

import pytest

from app.crud.events import create_event
from app.schemas.event import EventCreate


@pytest.fixture
def event(db_conn, calendar):
    """An event in the test calendar, cleaned up after each test."""
    ev = create_event(
        db_conn,
        EventCreate(
            calendar_id=calendar["id"],
            title="Test Event",
            date="2026-07-01",
            start_time="10:00:00",
        ),
    )
    yield ev
    with db_conn.cursor() as cur:
        cur.execute("DELETE FROM event_links WHERE event_id = %s", (ev["id"],))
        cur.execute("DELETE FROM events WHERE id = %s", (ev["id"],))
        db_conn.commit()


# ---------------------------------------------------------------------------
# Create link
# ---------------------------------------------------------------------------


class TestCreateEventLink:
    def test_returns_201_with_url_as_description(self, client, event, owner_headers):
        res = client.post(
            f"/api/events/{event['id']}/links",
            json={"url": "https://example.com"},
            headers=owner_headers,
        )

        assert res.status_code == 201
        body = res.json()
        assert body["url"] == "https://example.com"
        assert body["title"] is None
        assert body["event_id"] == event["id"]

    def test_non_member_cannot_add_link(self, client, event, other_headers):
        res = client.post(
            f"/api/events/{event['id']}/links",
            json={"url": "https://example.com"},
            headers=other_headers,
        )
        assert res.status_code == 403

    def test_requires_auth(self, client, event):
        res = client.post(
            f"/api/events/{event['id']}/links",
            json={"url": "https://example.com"},
        )
        assert res.status_code == 401

    def test_returns_404_for_unknown_event(self, client, owner_headers):
        res = client.post(
            "/api/events/999999/links",
            json={"url": "https://example.com"},
            headers=owner_headers,
        )
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# Delete link
# ---------------------------------------------------------------------------


class TestDeleteEventLink:
    def test_returns_204_on_success(self, client, event, owner_headers):
        create_res = client.post(
            f"/api/events/{event['id']}/links",
            json={"url": "https://example.com"},
            headers=owner_headers,
        )
        link_id = create_res.json()["id"]

        res = client.delete(
            f"/api/events/{event['id']}/links/{link_id}",
            headers=owner_headers,
        )
        assert res.status_code == 204

    def test_returns_404_for_unknown_link(self, client, event, owner_headers):
        res = client.delete(
            f"/api/events/{event['id']}/links/999999",
            headers=owner_headers,
        )
        assert res.status_code == 404

    def test_non_member_cannot_delete_link(self, client, event, owner_headers, other_headers):
        create_res = client.post(
            f"/api/events/{event['id']}/links",
            json={"url": "https://example.com"},
            headers=owner_headers,
        )
        link_id = create_res.json()["id"]

        res = client.delete(
            f"/api/events/{event['id']}/links/{link_id}",
            headers=other_headers,
        )
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Links in EventResponse
# ---------------------------------------------------------------------------


class TestLinksInEventResponse:
    def test_get_event_returns_empty_links_by_default(self, client, event, owner_headers):
        res = client.get(f"/api/events/{event['id']}", headers=owner_headers)

        assert res.status_code == 200
        assert res.json()["links"] == []

    def test_get_event_returns_links_after_adding(self, client, event, owner_headers):
        client.post(
            f"/api/events/{event['id']}/links",
            json={"url": "https://example.com"},
            headers=owner_headers,
        )

        res = client.get(f"/api/events/{event['id']}", headers=owner_headers)

        assert res.status_code == 200
        links = res.json()["links"]
        assert len(links) == 1
        assert links[0]["url"] == "https://example.com"
        assert links[0]["title"] is None
