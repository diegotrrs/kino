import importlib
from unittest.mock import patch

import pytest
from fastapi import HTTPException

import app.main
from app.config import Settings
from app.routers import test as router
from tests.unit.helpers import mock_settings

SECRET = "reset-secret"


@pytest.fixture
def settings():
    s = mock_settings()
    with patch("app.routers.test.get_settings", return_value=s):
        yield s


@pytest.fixture
def clock(monkeypatch):
    """Control the rate limiter: reset its state and pin time.monotonic."""
    monkeypatch.setattr(router, "_last_called_at", 0.0)
    with patch("app.routers.test.time.monotonic", return_value=1_000.0) as monotonic:
        yield monotonic


@pytest.fixture
def reset_data():
    with patch("app.routers.test.reset_test_user_data") as mock_reset:
        yield mock_reset


@pytest.fixture
def delete_user():
    with patch("app.routers.test.delete_user") as mock_delete:
        yield mock_delete


class TestResetEndpoint:
    @pytest.mark.parametrize(
        "overrides", [{"test_reset_secret": ""}, {"test_user_id": 0}], ids=["no_secret", "no_user"]
    )
    def test_disabled_when_not_configured(self, settings, clock, reset_data, db, overrides):
        for key, value in overrides.items():
            setattr(settings, key, value)

        with pytest.raises(HTTPException) as exc:
            router.reset_test_user(x_test_secret=SECRET, db=db)

        assert exc.value.status_code == 503
        reset_data.assert_not_called()

    def test_wrong_secret_is_forbidden(self, settings, clock, reset_data, db):
        with pytest.raises(HTTPException) as exc:
            router.reset_test_user(x_test_secret="wrong", db=db)

        assert exc.value.status_code == 403
        reset_data.assert_not_called()

    def test_resets_only_the_configured_test_user(self, settings, clock, reset_data, db):
        router.reset_test_user(x_test_secret=SECRET, db=db)

        reset_data.assert_called_once_with(db, settings.test_user_id)

    def test_second_call_within_five_seconds_is_rate_limited(self, settings, clock, reset_data, db):
        router.reset_test_user(x_test_secret=SECRET, db=db)
        clock.return_value = 1_004.9

        with pytest.raises(HTTPException) as exc:
            router.reset_test_user(x_test_secret=SECRET, db=db)

        assert exc.value.status_code == 429
        reset_data.assert_called_once()

    def test_call_after_five_seconds_is_allowed(self, settings, clock, reset_data, db):
        router.reset_test_user(x_test_secret=SECRET, db=db)
        clock.return_value = 1_005.1

        router.reset_test_user(x_test_secret=SECRET, db=db)

        assert reset_data.call_count == 2


class TestDeleteUserEndpoint:
    def test_disabled_without_secret(self, settings, delete_user, db):
        settings.test_reset_secret = ""

        with pytest.raises(HTTPException) as exc:
            router.delete_test_user(user_id=5, x_test_secret=SECRET, db=db)

        assert exc.value.status_code == 503
        delete_user.assert_not_called()

    def test_wrong_secret_is_forbidden(self, settings, delete_user, db):
        with pytest.raises(HTTPException) as exc:
            router.delete_test_user(user_id=5, x_test_secret="wrong", db=db)

        assert exc.value.status_code == 403
        delete_user.assert_not_called()

    def test_deletes_the_requested_user(self, settings, delete_user, db):
        router.delete_test_user(user_id=5, x_test_secret=SECRET, db=db)

        delete_user.assert_called_once_with(db, 5)


class TestRouterMounting:
    @pytest.fixture
    def main_with_env(self):
        """Re-import app.main under a given ENV, then restore the real module."""

        def load(env: str):
            with patch("app.config.get_settings", return_value=mock_settings(env=env)):
                return importlib.reload(app.main).app

        yield load
        importlib.reload(app.main)

    @staticmethod
    def has_test_routes(fastapi_app) -> bool:
        return any(path.startswith("/api/test") for path in fastapi_app.openapi()["paths"])

    def test_test_routes_are_not_mounted_in_production(self, main_with_env):
        assert not self.has_test_routes(main_with_env("production"))

    def test_test_routes_are_mounted_outside_production(self, main_with_env):
        assert self.has_test_routes(main_with_env("development"))

    @pytest.mark.xfail(strict=True, reason="Risk: ENV defaults to development, so a missing ENV mounts /api/test")
    def test_env_defaults_to_production(self, monkeypatch):
        monkeypatch.delenv("ENV", raising=False)

        assert Settings(_env_file=None).env == "production"
