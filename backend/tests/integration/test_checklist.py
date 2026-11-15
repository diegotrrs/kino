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


def _add_item(client, calendar: dict, headers: dict, text: str = "Buy travel insurance") -> dict:
    return client.post(_checklist_url(calendar), json={"text": text}, headers=headers).json()


class TestUpdateChecklistItem:
    def test_ticking_an_item_is_saved_and_stamps_updated_at(self, client, calendar, owner_headers):
        item = _add_item(client, calendar, owner_headers)

        res = client.patch(f"{_checklist_url(calendar)}/{item['id']}", json={"is_done": True}, headers=owner_headers)

        assert res.status_code == 200
        assert res.json()["is_done"] is True
        assert res.json()["updated_at"] is not None
        assert client.get(_checklist_url(calendar), headers=owner_headers).json()[0]["is_done"] is True

    def test_editing_text_keeps_the_done_state_and_position(self, client, calendar, owner_headers):
        _add_item(client, calendar, owner_headers, "First")
        item = _add_item(client, calendar, owner_headers, "Renew pasport")
        client.patch(f"{_checklist_url(calendar)}/{item['id']}", json={"is_done": True}, headers=owner_headers)

        res = client.patch(
            f"{_checklist_url(calendar)}/{item['id']}", json={"text": "Renew passport"}, headers=owner_headers
        )

        body = res.json()
        assert (body["text"], body["is_done"], body["position"]) == ("Renew passport", True, 1)

    def test_non_member_cannot_tick_an_item(self, client, calendar, owner_headers, other_headers):
        item = _add_item(client, calendar, owner_headers)

        res = client.patch(f"{_checklist_url(calendar)}/{item['id']}", json={"is_done": True}, headers=other_headers)

        assert res.status_code == 403
        assert client.get(_checklist_url(calendar), headers=owner_headers).json()[0]["is_done"] is False

    def test_item_from_another_calendar_returns_404_and_is_unchanged(
        self, client, db_conn, calendar, other_user, other_headers
    ):
        others_calendar = create_calendar(db_conn, CalendarCreate(name="Other trip", created_by=other_user["id"]))
        try:
            foreign = _add_item(client, others_calendar, other_headers, "Their item")
            add_user_to_calendar(db_conn, calendar["id"], other_user["id"])

            res = client.patch(
                f"{_checklist_url(calendar)}/{foreign['id']}", json={"text": "Hijacked"}, headers=other_headers
            )

            assert res.status_code == 404
            assert client.get(_checklist_url(others_calendar), headers=other_headers).json()[0]["text"] == "Their item"
        finally:
            with db_conn.cursor() as cur:
                cur.execute("DELETE FROM calendar_users WHERE calendar_id = %s", (others_calendar["id"],))
                cur.execute("DELETE FROM calendars WHERE id = %s", (others_calendar["id"],))
            db_conn.commit()

    def test_empty_change_is_rejected(self, client, calendar, owner_headers):
        item = _add_item(client, calendar, owner_headers)

        res = client.patch(f"{_checklist_url(calendar)}/{item['id']}", json={}, headers=owner_headers)

        assert res.status_code == 422


class TestDeleteChecklistItem:
    def test_member_deletes_an_item_and_the_rest_keep_their_order(self, client, calendar, owner_headers):
        for text in ["First", "Second", "Third"]:
            _add_item(client, calendar, owner_headers, text)
        second = client.get(_checklist_url(calendar), headers=owner_headers).json()[1]

        res = client.delete(f"{_checklist_url(calendar)}/{second['id']}", headers=owner_headers)

        assert res.status_code == 204
        listed = client.get(_checklist_url(calendar), headers=owner_headers).json()
        assert [item["text"] for item in listed] == ["First", "Third"]

    def test_non_member_cannot_delete_an_item(self, client, calendar, owner_headers, other_headers):
        item = _add_item(client, calendar, owner_headers)

        res = client.delete(f"{_checklist_url(calendar)}/{item['id']}", headers=other_headers)

        assert res.status_code == 403
        assert len(client.get(_checklist_url(calendar), headers=owner_headers).json()) == 1

    def test_item_from_another_calendar_returns_404_and_is_kept(
        self, client, db_conn, calendar, other_user, other_headers
    ):
        others_calendar = create_calendar(db_conn, CalendarCreate(name="Other trip", created_by=other_user["id"]))
        try:
            foreign = _add_item(client, others_calendar, other_headers, "Their item")
            add_user_to_calendar(db_conn, calendar["id"], other_user["id"])

            res = client.delete(f"{_checklist_url(calendar)}/{foreign['id']}", headers=other_headers)

            assert res.status_code == 404
            assert len(client.get(_checklist_url(others_calendar), headers=other_headers).json()) == 1
        finally:
            with db_conn.cursor() as cur:
                cur.execute("DELETE FROM calendar_users WHERE calendar_id = %s", (others_calendar["id"],))
                cur.execute("DELETE FROM calendars WHERE id = %s", (others_calendar["id"],))
            db_conn.commit()

    def test_deleting_twice_returns_404(self, client, calendar, owner_headers):
        item = _add_item(client, calendar, owner_headers)
        client.delete(f"{_checklist_url(calendar)}/{item['id']}", headers=owner_headers)

        res = client.delete(f"{_checklist_url(calendar)}/{item['id']}", headers=owner_headers)

        assert res.status_code == 404
