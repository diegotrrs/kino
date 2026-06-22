"""
Integration tests for the event costs API.

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
        cur.execute("DELETE FROM event_costs WHERE event_id = %s", (ev["id"],))
        cur.execute("DELETE FROM events WHERE id = %s", (ev["id"],))
        db_conn.commit()


# ---------------------------------------------------------------------------
# Create cost
# ---------------------------------------------------------------------------


class TestCreateEventCost:
    def test_returns_201_with_cost_fields(self, client, event, owner_headers):
        res = client.post(
            f"/api/events/{event['id']}/costs",
            json={"label": "Coffee", "amount": 2.50, "currency": "GBP"},
            headers=owner_headers,
        )

        assert res.status_code == 201
        body = res.json()
        assert body["label"] == "Coffee"
        assert float(body["amount"]) == 2.50
        assert body["currency"] == "GBP"
        assert body["event_id"] == event["id"]

    def test_non_member_cannot_add_cost(self, client, event, other_headers):
        res = client.post(
            f"/api/events/{event['id']}/costs",
            json={"label": "Ticket", "amount": 10.00, "currency": "EUR"},
            headers=other_headers,
        )
        assert res.status_code == 403

    def test_requires_auth(self, client, event):
        res = client.post(
            f"/api/events/{event['id']}/costs",
            json={"label": "Ticket", "amount": 10.00, "currency": "EUR"},
        )
        assert res.status_code == 403

    def test_returns_404_for_unknown_event(self, client, owner_headers):
        res = client.post(
            "/api/events/999999/costs",
            json={"label": "Coffee", "amount": 2.50, "currency": "GBP"},
            headers=owner_headers,
        )
        assert res.status_code == 404

    def test_rejects_zero_amount(self, client, event, owner_headers):
        res = client.post(
            f"/api/events/{event['id']}/costs",
            json={"label": "Free thing", "amount": 0, "currency": "GBP"},
            headers=owner_headers,
        )
        assert res.status_code == 422

    def test_rejects_negative_amount(self, client, event, owner_headers):
        res = client.post(
            f"/api/events/{event['id']}/costs",
            json={"label": "Refund", "amount": -5.00, "currency": "GBP"},
            headers=owner_headers,
        )
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# Delete cost
# ---------------------------------------------------------------------------


class TestDeleteEventCost:
    def test_returns_204_on_success(self, client, event, owner_headers):
        create_res = client.post(
            f"/api/events/{event['id']}/costs",
            json={"label": "Museum", "amount": 12.00, "currency": "GBP"},
            headers=owner_headers,
        )
        cost_id = create_res.json()["id"]

        res = client.delete(
            f"/api/events/{event['id']}/costs/{cost_id}",
            headers=owner_headers,
        )
        assert res.status_code == 204

    def test_returns_404_for_unknown_cost(self, client, event, owner_headers):
        res = client.delete(
            f"/api/events/{event['id']}/costs/999999",
            headers=owner_headers,
        )
        assert res.status_code == 404

    def test_non_member_cannot_delete_cost(self, client, event, owner_headers, other_headers):
        create_res = client.post(
            f"/api/events/{event['id']}/costs",
            json={"label": "Museum", "amount": 12.00, "currency": "GBP"},
            headers=owner_headers,
        )
        cost_id = create_res.json()["id"]

        res = client.delete(
            f"/api/events/{event['id']}/costs/{cost_id}",
            headers=other_headers,
        )
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Costs in EventResponse
# ---------------------------------------------------------------------------


class TestCostsInEventResponse:
    def test_get_event_returns_empty_costs_by_default(self, client, event, owner_headers):
        res = client.get(f"/api/events/{event['id']}", headers=owner_headers)

        assert res.status_code == 200
        assert res.json()["costs"] == []

    def test_get_event_returns_costs_after_adding(self, client, event, owner_headers):
        client.post(
            f"/api/events/{event['id']}/costs",
            json={"label": "Coffee", "amount": 2.50, "currency": "GBP"},
            headers=owner_headers,
        )
        client.post(
            f"/api/events/{event['id']}/costs",
            json={"label": "Ticket", "amount": 15.00, "currency": "EUR"},
            headers=owner_headers,
        )

        res = client.get(f"/api/events/{event['id']}", headers=owner_headers)

        assert res.status_code == 200
        costs = res.json()["costs"]
        assert len(costs) == 2
        labels = {c["label"] for c in costs}
        assert labels == {"Coffee", "Ticket"}
