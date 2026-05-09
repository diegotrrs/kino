"""
Integration tests for the users API (profile update / locale).
"""


class TestGetUser:
    def test_locale_defaults_to_en(self, client, owner, owner_headers):
        res = client.get(f"/api/users/{owner['id']}", headers=owner_headers)

        assert res.status_code == 200
        assert res.json()['locale'] == 'en'

    def test_cannot_view_other_users_profile(self, client, owner, other_user, other_headers):
        res = client.get(f"/api/users/{owner['id']}", headers=other_headers)

        assert res.status_code == 403


class TestUpdateUser:
    def test_user_can_update_locale(self, client, owner, owner_headers):
        res = client.patch(
            f"/api/users/{owner['id']}",
            json={'locale': 'es'},
            headers=owner_headers,
        )

        assert res.status_code == 200
        assert res.json()['locale'] == 'es'

    def test_locale_is_persisted(self, client, owner, owner_headers):
        client.patch(
            f"/api/users/{owner['id']}",
            json={'locale': 'pt'},
            headers=owner_headers,
        )

        res = client.get(f"/api/users/{owner['id']}", headers=owner_headers)
        assert res.json()['locale'] == 'pt'

    def test_user_cannot_update_other_users_locale(self, client, owner, other_headers):
        res = client.patch(
            f"/api/users/{owner['id']}",
            json={'locale': 'de'},
            headers=other_headers,
        )

        assert res.status_code == 403

    def test_empty_patch_returns_current_user(self, client, owner, owner_headers):
        res = client.patch(
            f"/api/users/{owner['id']}",
            json={},
            headers=owner_headers,
        )

        assert res.status_code == 200
        assert res.json()['id'] == owner['id']
