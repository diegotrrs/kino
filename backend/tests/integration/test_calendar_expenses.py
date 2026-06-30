"""
Integration tests for the calendar expenses API.

These tests hit a real PostgreSQL database. Each test is isolated:
fixtures create the data they need and clean up after themselves.
"""

import pytest


@pytest.fixture(autouse=True)
def cleanup_expenses(db_conn, calendar):
    yield
    with db_conn.cursor() as cur:
        cur.execute("DELETE FROM calendar_expenses WHERE calendar_id = %s", (calendar["id"],))
        db_conn.commit()


class TestListCalendarExpenses:
    def test_returns_empty_list_when_no_expenses(self, client, calendar, owner_headers):
        res = client.get(f"/api/calendars/{calendar['uuid']}/expenses", headers=owner_headers)
        assert res.status_code == 200
        assert res.json() == []

    def test_returns_created_expense(self, client, calendar, owner_headers):
        client.post(
            f"/api/calendars/{calendar['uuid']}/expenses",
            json={"label": "Travel insurance", "amount": 62.00, "currency": "GBP"},
            headers=owner_headers,
        )
        res = client.get(f"/api/calendars/{calendar['uuid']}/expenses", headers=owner_headers)
        assert res.status_code == 200
        body = res.json()
        assert len(body) == 1
        assert body[0]["label"] == "Travel insurance"

    def test_non_member_cannot_list_expenses_on_private_calendar(self, client, calendar, other_headers):
        res = client.get(f"/api/calendars/{calendar['uuid']}/expenses", headers=other_headers)
        assert res.status_code == 403

    def test_unauthenticated_can_list_expenses_on_public_calendar(self, client, calendar, owner_headers):
        client.patch(
            f"/api/calendars/{calendar['uuid']}",
            json={"is_public": True},
            headers=owner_headers,
        )
        client.post(
            f"/api/calendars/{calendar['uuid']}/expenses",
            json={"label": "Visa", "amount": 45.00, "currency": "EUR"},
            headers=owner_headers,
        )
        res = client.get(f"/api/calendars/{calendar['uuid']}/expenses")
        assert res.status_code == 200
        assert len(res.json()) == 1


class TestCreateCalendarExpense:
    def test_returns_201_with_expense_fields(self, client, calendar, owner_headers):
        res = client.post(
            f"/api/calendars/{calendar['uuid']}/expenses",
            json={"label": "Travel insurance", "amount": 62.50, "currency": "GBP"},
            headers=owner_headers,
        )
        assert res.status_code == 201
        body = res.json()
        assert body["label"] == "Travel insurance"
        assert float(body["amount"]) == 62.50
        assert body["currency"] == "GBP"
        assert body["calendar_id"] == calendar["id"]

    def test_editor_can_add_expense(self, client, calendar, other_user, other_headers, owner_headers):
        client.post(
            f"/api/calendars/{calendar['uuid']}/invite",
            json={"email": other_user["email"]},
            headers=owner_headers,
        )
        res = client.post(
            f"/api/calendars/{calendar['uuid']}/expenses",
            json={"label": "Taxi", "amount": 15.00, "currency": "EUR"},
            headers=other_headers,
        )
        assert res.status_code == 201

    def test_non_member_cannot_add_expense(self, client, calendar, other_headers):
        res = client.post(
            f"/api/calendars/{calendar['uuid']}/expenses",
            json={"label": "Ticket", "amount": 10.00, "currency": "EUR"},
            headers=other_headers,
        )
        assert res.status_code == 403

    def test_unauthenticated_cannot_add_expense(self, client, calendar):
        res = client.post(
            f"/api/calendars/{calendar['uuid']}/expenses",
            json={"label": "Ticket", "amount": 10.00, "currency": "EUR"},
        )
        assert res.status_code in (401, 403)


class TestDeleteCalendarExpense:
    def test_returns_204_and_expense_is_gone(self, client, calendar, owner_headers):
        create_res = client.post(
            f"/api/calendars/{calendar['uuid']}/expenses",
            json={"label": "Visa fee", "amount": 80.00, "currency": "USD"},
            headers=owner_headers,
        )
        expense_id = create_res.json()["id"]

        res = client.delete(
            f"/api/calendars/{calendar['uuid']}/expenses/{expense_id}",
            headers=owner_headers,
        )
        assert res.status_code == 204

        list_res = client.get(f"/api/calendars/{calendar['uuid']}/expenses", headers=owner_headers)
        assert list_res.json() == []

    def test_non_member_cannot_delete_expense(self, client, calendar, owner_headers, other_headers):
        create_res = client.post(
            f"/api/calendars/{calendar['uuid']}/expenses",
            json={"label": "Visa fee", "amount": 80.00, "currency": "USD"},
            headers=owner_headers,
        )
        expense_id = create_res.json()["id"]

        res = client.delete(
            f"/api/calendars/{calendar['uuid']}/expenses/{expense_id}",
            headers=other_headers,
        )
        assert res.status_code == 403

    def test_delete_non_existent_expense_returns_404(self, client, calendar, owner_headers):
        res = client.delete(
            f"/api/calendars/{calendar['uuid']}/expenses/999999",
            headers=owner_headers,
        )
        assert res.status_code == 404
