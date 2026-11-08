DAY = "2035-06-01"


def _day_names_url(calendar: dict, day: str = "") -> str:
    base = f"/api/calendars/{calendar['uuid']}/day-names"
    return f"{base}/{day}" if day else base


class TestSetDayName:
    def test_requires_auth(self, client, calendar):
        res = client.put(_day_names_url(calendar, DAY), json={"name": "Visit to Vatican"})
        assert res.status_code == 401

    def test_non_member_cannot_name_a_day(self, client, calendar, other_headers):
        res = client.put(_day_names_url(calendar, DAY), json={"name": "Visit to Vatican"}, headers=other_headers)
        assert res.status_code == 403

    def test_owner_names_a_day_and_it_is_listed(self, client, calendar, owner_headers):
        res = client.put(_day_names_url(calendar, DAY), json={"name": "Visit to Vatican"}, headers=owner_headers)

        assert res.status_code == 200
        assert res.json() == {"date": DAY, "name": "Visit to Vatican"}
        listed = client.get(_day_names_url(calendar), headers=owner_headers).json()
        assert listed == [{"date": DAY, "name": "Visit to Vatican"}]

    def test_naming_the_same_day_again_replaces_the_name(self, client, calendar, owner_headers):
        client.put(_day_names_url(calendar, DAY), json={"name": "Rome"}, headers=owner_headers)
        client.put(_day_names_url(calendar, DAY), json={"name": "Visit to Vatican"}, headers=owner_headers)

        listed = client.get(_day_names_url(calendar), headers=owner_headers).json()
        assert listed == [{"date": DAY, "name": "Visit to Vatican"}]

    def test_empty_or_too_long_names_are_rejected(self, client, calendar, owner_headers):
        for name in ["   ", "x" * 61]:
            res = client.put(_day_names_url(calendar, DAY), json={"name": name}, headers=owner_headers)
            assert res.status_code == 422


class TestListDayNames:
    def test_private_calendar_is_hidden_from_non_members(self, client, calendar, other_headers):
        res = client.get(_day_names_url(calendar), headers=other_headers)
        assert res.status_code == 403


class TestDeleteDayName:
    def test_removes_the_name(self, client, calendar, owner_headers):
        client.put(_day_names_url(calendar, DAY), json={"name": "Rome"}, headers=owner_headers)

        res = client.delete(_day_names_url(calendar, DAY), headers=owner_headers)

        assert res.status_code == 204
        assert client.get(_day_names_url(calendar), headers=owner_headers).json() == []

    def test_day_without_a_name_returns_404(self, client, calendar, owner_headers):
        res = client.delete(_day_names_url(calendar, DAY), headers=owner_headers)
        assert res.status_code == 404


class TestDayNamesSurviveDeleteAndRestore:
    def test_restoring_a_deleted_calendar_brings_its_day_names_back(self, client, calendar, owner_headers):
        client.put(_day_names_url(calendar, DAY), json={"name": "Visit to Vatican"}, headers=owner_headers)

        assert client.delete(f"/api/calendars/{calendar['uuid']}", headers=owner_headers).status_code == 204
        assert client.post(f"/api/calendars/{calendar['uuid']}/restore", headers=owner_headers).status_code == 204

        listed = client.get(_day_names_url(calendar), headers=owner_headers).json()
        assert listed == [{"date": DAY, "name": "Visit to Vatican"}]
