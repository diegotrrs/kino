"""
Integration tests for the calendars API.

These tests hit a real PostgreSQL database. Each test is isolated:
fixtures create the data they need and clean up after themselves.

Requirements:
  - PostgreSQL running at DATABASE_URL (default: localhost:5432/kino)
  - Run with: pytest tests/integration
"""

# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


class TestCreateCalendar:
    def test_returns_201_with_owner_role(self, client, owner_headers, track_calendar):
        res = client.post(
            "/api/calendars/", json={"name": "My Trip"}, headers=owner_headers
        )

        assert res.status_code == 201
        body = res.json()
        assert body["name"] == "My Trip"
        assert body["role"] == "owner"
        assert body["is_favourite"] is False
        assert body["is_public"] is False
        assert "start_date" in body
        track_calendar(body["id"])

    def test_start_date_defaults_to_today(self, client, owner_headers, track_calendar):
        from datetime import date
        res = client.post(
            "/api/calendars/", json={"name": "No Date Trip"}, headers=owner_headers
        )

        assert res.status_code == 201
        body = res.json()
        assert body["start_date"] == date.today().isoformat()
        track_calendar(body["id"])

    def test_start_date_can_be_set_on_create(self, client, owner_headers, track_calendar):
        res = client.post(
            "/api/calendars/",
            json={"name": "Japan Trip", "start_date": "2027-03-15"},
            headers=owner_headers,
        )

        assert res.status_code == 201
        body = res.json()
        assert body["start_date"] == "2027-03-15"
        track_calendar(body["id"])

    def test_requires_auth(self, client):
        res = client.post("/api/calendars/", json={"name": "My Trip"})

        # FastAPI's HTTPBearer returns 403 when no Authorization header is present
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------


class TestGetCalendar:
    def test_owner_can_get_their_calendar(self, client, calendar, owner_headers):
        res = client.get(f"/api/calendars/{calendar['uuid']}", headers=owner_headers)

        assert res.status_code == 200
        assert res.json()["id"] == calendar["id"]

    def test_non_member_cannot_access_private_calendar(
        self, client, calendar, other_headers
    ):  # other_headers matches a registered fixture,
        # so it's injected
        res = client.get(f"/api/calendars/{calendar['uuid']}", headers=other_headers)

        assert res.status_code == 403

    def test_unauthenticated_user_cannot_access_private_calendar(
        self, client, calendar
    ):
        res = client.get(f"/api/calendars/{calendar['uuid']}")

        assert res.status_code == 403

    def test_public_calendar_accessible_without_auth(
        self, client, calendar, owner_headers
    ):
        # Make the calendar public first
        client.patch(
            f"/api/calendars/{calendar['uuid']}",
            json={"is_public": True},
            headers=owner_headers,
        )

        res = client.get(f"/api/calendars/{calendar['uuid']}")

        assert res.status_code == 200
        assert res.json()["is_public"] is True

    def test_unknown_uuid_returns_404(self, client, owner_headers):
        res = client.get(
            "/api/calendars/00000000-0000-0000-0000-000000000000", headers=owner_headers
        )

        assert res.status_code == 404


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


class TestUpdateCalendar:
    def test_owner_can_update_name(self, client, calendar, owner_headers):
        res = client.patch(
            f"/api/calendars/{calendar['uuid']}",
            json={"name": "Updated Name"},
            headers=owner_headers,
        )

        assert res.status_code == 200
        assert res.json()["name"] == "Updated Name"

    def test_owner_can_toggle_public(self, client, calendar, owner_headers):
        res = client.patch(
            f"/api/calendars/{calendar['uuid']}",
            json={"is_public": True},
            headers=owner_headers,
        )

        assert res.status_code == 200
        assert res.json()["is_public"] is True

    def test_owner_can_update_start_date(self, client, calendar, owner_headers):
        res = client.patch(
            f"/api/calendars/{calendar['uuid']}",
            json={"start_date": "2028-06-01"},
            headers=owner_headers,
        )

        assert res.status_code == 200
        assert res.json()["start_date"] == "2028-06-01"

    def test_non_owner_cannot_update(self, client, calendar, other_headers):
        res = client.patch(
            f"/api/calendars/{calendar['uuid']}",
            json={"name": "Hacked"},
            headers=other_headers,
        )

        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Delete (soft delete)
# ---------------------------------------------------------------------------


class TestDeleteCalendar:
    def test_owner_can_delete(self, client, calendar, owner_headers):
        res = client.delete(f"/api/calendars/{calendar['uuid']}", headers=owner_headers)

        assert res.status_code == 204

    def test_deleted_calendar_no_longer_in_list(self, client, calendar, owner_headers):
        client.delete(f"/api/calendars/{calendar['uuid']}", headers=owner_headers)

        res = client.get("/api/calendars/", headers=owner_headers)
        ids = [c["id"] for c in res.json()]
        assert calendar["id"] not in ids

    def test_deleted_calendar_appears_in_deleted_list(
        self, client, calendar, owner_headers
    ):
        client.delete(f"/api/calendars/{calendar['uuid']}", headers=owner_headers)

        res = client.get("/api/calendars/deleted", headers=owner_headers)
        uuids = [c["uuid"] for c in res.json()]
        assert str(calendar["uuid"]) in uuids

    def test_non_owner_cannot_delete(self, client, calendar, other_headers):
        res = client.delete(f"/api/calendars/{calendar['uuid']}", headers=other_headers)

        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Restore
# ---------------------------------------------------------------------------


class TestRestoreCalendar:
    def test_deleted_calendar_can_be_restored(self, client, calendar, owner_headers):
        client.delete(f"/api/calendars/{calendar['uuid']}", headers=owner_headers)

        res = client.post(
            f"/api/calendars/{calendar['uuid']}/restore", headers=owner_headers
        )
        assert res.status_code == 204

        # Calendar should be back in the active list
        list_res = client.get("/api/calendars/", headers=owner_headers)
        ids = [c["id"] for c in list_res.json()]
        assert calendar["id"] in ids


# ---------------------------------------------------------------------------
# Membership
# ---------------------------------------------------------------------------


class TestMembership:
    def test_owner_can_invite_user_by_email(
        self, client, calendar, owner_headers, other_user
    ):
        res = client.post(
            f"/api/calendars/{calendar['uuid']}/invite",
            json={"email": other_user["email"]},
            headers=owner_headers,
        )

        assert res.status_code == 201
        body = res.json()
        assert body["email"] == other_user["email"]
        assert body["role"] == "editor"

    def test_invited_user_appears_in_member_list(
        self, client, calendar, owner_headers, other_user
    ):
        client.post(
            f"/api/calendars/{calendar['uuid']}/invite",
            json={"email": other_user["email"]},
            headers=owner_headers,
        )

        res = client.get(
            f"/api/calendars/{calendar['uuid']}/users", headers=owner_headers
        )
        emails = [m["email"] for m in res.json()]
        assert other_user["email"] in emails

    def test_editor_cannot_update_calendar(
        self, client, calendar, owner_headers, other_user, other_headers
    ):
        client.post(
            f"/api/calendars/{calendar['uuid']}/invite",
            json={"email": other_user["email"]},
            headers=owner_headers,
        )

        res = client.patch(
            f"/api/calendars/{calendar['uuid']}",
            json={"name": "Should Fail"},
            headers=other_headers,
        )
        assert res.status_code == 403

    def test_owner_can_remove_member(self, client, calendar, owner_headers, other_user):
        client.post(
            f"/api/calendars/{calendar['uuid']}/invite",
            json={"email": other_user["email"]},
            headers=owner_headers,
        )

        res = client.delete(
            f"/api/calendars/{calendar['uuid']}/users/{other_user['id']}",
            headers=owner_headers,
        )
        assert res.status_code == 204

    def test_non_owner_cannot_invite(self, client, calendar, other_headers):
        res = client.post(
            f"/api/calendars/{calendar['uuid']}/invite",
            json={"email": "anyone@example.com"},
            headers=other_headers,
        )

        assert res.status_code == 403
