from app.crud.calendars import add_user_to_calendar, create_calendar
from app.schemas.calendar import CalendarCreate


def _checklist_url(calendar: dict) -> str:
    return f"/api/calendars/{calendar['uuid']}/checklist"


def _make_public(client, calendar: dict, owner_headers: dict) -> None:
    client.patch(f"/api/calendars/{calendar['uuid']}", json={"is_public": True}, headers=owner_headers)


class TestListChecklist:
    def test_requires_auth(self, client, calendar):
        res = client.get(_checklist_url(calendar))
        assert res.status_code == 401

    def test_non_member_cannot_list_a_private_checklist(self, client, calendar, other_headers):
        res = client.get(_checklist_url(calendar), headers=other_headers)
        assert res.status_code == 403

    def test_public_calendar_checklist_is_hidden_from_anonymous_visitors(self, client, calendar, owner_headers):
        _make_public(client, calendar, owner_headers)

        res = client.get(_checklist_url(calendar))

        assert res.status_code == 401

    def test_public_calendar_checklist_is_hidden_from_non_members(
        self, client, calendar, owner_headers, other_headers
    ):
        _make_public(client, calendar, owner_headers)

        res = client.get(_checklist_url(calendar), headers=other_headers)

        assert res.status_code == 403

    def test_new_calendar_has_an_empty_checklist(self, client, calendar, owner_headers):
        res = client.get(_checklist_url(calendar), headers=owner_headers)

        assert res.status_code == 200
        assert res.json() == []

    def test_unknown_calendar_returns_404(self, client, owner_headers):
        res = client.get("/api/calendars/00000000-0000-0000-0000-000000000000/checklist", headers=owner_headers)
        assert res.status_code == 404


class TestCreateChecklistItem:
    def test_requires_auth(self, client, calendar):
        res = client.post(_checklist_url(calendar), json={"text": "Buy travel insurance"})
        assert res.status_code == 401

    def test_non_member_cannot_add_an_item(self, client, calendar, owner_headers, other_headers):
        res = client.post(_checklist_url(calendar), json={"text": "Buy travel insurance"}, headers=other_headers)

        assert res.status_code == 403
        assert client.get(_checklist_url(calendar), headers=owner_headers).json() == []

    def test_owner_adds_an_item_that_starts_not_done(self, client, calendar, owner_headers):
        res = client.post(_checklist_url(calendar), json={"text": "Buy travel insurance"}, headers=owner_headers)

        assert res.status_code == 201
        body = res.json()
        assert body["text"] == "Buy travel insurance"
        assert body["is_done"] is False
        assert body["position"] == 0
        assert body["updated_at"] is None
        assert set(body) == {"id", "text", "is_done", "position", "created_at", "updated_at"}

    def test_editor_can_add_an_item(self, client, db_conn, calendar, other_user, other_headers):
        add_user_to_calendar(db_conn, calendar["id"], other_user["id"])

        res = client.post(_checklist_url(calendar), json={"text": "Book airport transfer"}, headers=other_headers)

        assert res.status_code == 201

    def test_new_items_are_appended_and_listed_in_order(self, client, calendar, owner_headers):
        for text in ["Buy travel insurance", "Book airport transfer", "Renew passport"]:
            client.post(_checklist_url(calendar), json={"text": text}, headers=owner_headers)

        listed = client.get(_checklist_url(calendar), headers=owner_headers).json()

        assert [item["text"] for item in listed] == ["Buy travel insurance", "Book airport transfer", "Renew passport"]
        assert [item["position"] for item in listed] == [0, 1, 2]

    def test_html_is_stripped_before_storing(self, client, calendar, owner_headers):
        res = client.post(
            _checklist_url(calendar), json={"text": "<script>x</script>Renew passport"}, headers=owner_headers
        )

        assert res.json()["text"] == "xRenew passport"

    def test_blank_or_too_long_text_is_rejected(self, client, calendar, owner_headers):
        for text in ["   ", "x" * 201]:
            res = client.post(_checklist_url(calendar), json={"text": text}, headers=owner_headers)
            assert res.status_code == 422

    def test_a_full_checklist_rejects_another_item(self, client, db_conn, calendar, owner_headers):
        with db_conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO calendar_checklist_items (calendar_id, text, position)
                SELECT %s, 'Item ' || n, n FROM generate_series(0, 99) AS n
                """,
                (calendar["id"],),
            )
        db_conn.commit()

        res = client.post(_checklist_url(calendar), json={"text": "One too many"}, headers=owner_headers)

        assert res.status_code == 409
        assert len(client.get(_checklist_url(calendar), headers=owner_headers).json()) == 100

    def test_positions_are_independent_per_calendar(self, client, db_conn, calendar, owner, owner_headers):
        second = create_calendar(db_conn, CalendarCreate(name="Second", created_by=owner["id"]))
        try:
            client.post(_checklist_url(calendar), json={"text": "First trip item"}, headers=owner_headers)

            res = client.post(_checklist_url(second), json={"text": "Second trip item"}, headers=owner_headers)

            assert res.json()["position"] == 0
        finally:
            with db_conn.cursor() as cur:
                cur.execute("DELETE FROM calendar_users WHERE calendar_id = %s", (second["id"],))
                cur.execute("DELETE FROM calendars WHERE id = %s", (second["id"],))
            db_conn.commit()
