from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import patch

import pytest
import time_machine
from fastapi import HTTPException

from app.auth import hash_password, verify_password
from app.routers import auth as router
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
)
from tests.unit.helpers import mock_settings

NOW = datetime(2030, 6, 1, 12, 0, tzinfo=UTC)
GENERIC_MESSAGE = "If that email is registered, a reset link has been sent."
STORED_USER = {"id": 1, "email": "ana@example.com", "password_hash": hash_password("correct-password")}


@pytest.fixture
def auth():
    """Patch every collaborator the auth router imports by name."""
    names = [
        "get_user_by_email",
        "create_user",
        "create_access_token",
        "create_password_reset_token",
        "get_password_reset_token",
        "mark_token_used",
        "update_user_password",
        "send_password_reset_email",
    ]
    mocks = {name: patch(f"app.routers.auth.{name}").start() for name in names}
    patch("app.routers.auth.get_settings", return_value=mock_settings()).start()
    yield SimpleNamespace(**mocks)
    patch.stopall()


def reset_row(expires_at: datetime, used_at: datetime | None = None) -> dict:
    return {"user_id": 1, "token": "tok", "expires_at": expires_at, "used_at": used_at}


class TestLogin:
    def test_unknown_email_and_wrong_password_give_the_same_error(self, auth, db):
        auth.get_user_by_email.return_value = None
        with pytest.raises(HTTPException) as unknown:
            router.login(body=LoginRequest(email="nobody@example.com", password="x"), db=db)

        auth.get_user_by_email.return_value = STORED_USER
        with pytest.raises(HTTPException) as wrong:
            router.login(body=LoginRequest(email="ana@example.com", password="wrong-password"), db=db)

        assert unknown.value.status_code == wrong.value.status_code == 401
        assert unknown.value.detail == wrong.value.detail
        auth.create_access_token.assert_not_called()

    def test_correct_credentials_issue_a_token_for_the_user(self, auth, db):
        auth.get_user_by_email.return_value = STORED_USER
        auth.create_access_token.return_value = "jwt"

        response = router.login(body=LoginRequest(email="ana@example.com", password="correct-password"), db=db)

        auth.create_access_token.assert_called_once_with({"sub": "1"})
        assert response.access_token == "jwt"


class TestSignup:
    def test_existing_email_returns_409(self, auth, db):
        auth.get_user_by_email.return_value = STORED_USER

        with pytest.raises(HTTPException) as exc:
            router.signup(body=SignupRequest(name="Ana", email="ana@example.com", password="pw"), db=db)

        assert exc.value.status_code == 409
        auth.create_user.assert_not_called()

    def test_new_user_is_created_and_receives_a_token(self, auth, db):
        auth.get_user_by_email.return_value = None
        auth.create_user.return_value = {"id": 42}
        auth.create_access_token.return_value = "jwt"

        response = router.signup(body=SignupRequest(name="Leo", email="leo@example.com", password="pw"), db=db)

        auth.create_access_token.assert_called_once_with({"sub": "42"})
        assert response.access_token == "jwt"


class TestForgotPassword:
    def test_unknown_email_returns_generic_message_without_side_effects(self, auth, db):
        auth.get_user_by_email.return_value = None

        response = router.forgot_password(body=ForgotPasswordRequest(email="nobody@example.com"), db=db)

        assert response.message == GENERIC_MESSAGE
        auth.create_password_reset_token.assert_not_called()
        auth.send_password_reset_email.assert_not_called()

    @time_machine.travel(NOW, tick=False)
    def test_known_email_stores_a_one_hour_token_and_emails_the_link(self, auth, db):
        auth.get_user_by_email.return_value = STORED_USER

        response = router.forgot_password(body=ForgotPasswordRequest(email="ana@example.com"), db=db)

        _, user_id, token, expires_at = auth.create_password_reset_token.call_args.args
        assert user_id == STORED_USER["id"]
        assert len(token) == 64
        assert expires_at == NOW + timedelta(hours=1)
        auth.send_password_reset_email.assert_called_once_with(
            to_email="ana@example.com", reset_url=f"http://localhost:3000/reset-password?token={token}"
        )
        assert response.message == GENERIC_MESSAGE

    def test_email_failure_still_returns_the_generic_message(self, auth, db):
        auth.get_user_by_email.return_value = STORED_USER
        auth.send_password_reset_email.side_effect = RuntimeError("Resend down")

        response = router.forgot_password(body=ForgotPasswordRequest(email="ana@example.com"), db=db)

        assert response.message == GENERIC_MESSAGE

    def test_each_request_gets_a_different_token(self, auth, db):
        auth.get_user_by_email.return_value = STORED_USER

        router.forgot_password(body=ForgotPasswordRequest(email="ana@example.com"), db=db)
        router.forgot_password(body=ForgotPasswordRequest(email="ana@example.com"), db=db)

        first, second = (c.args[2] for c in auth.create_password_reset_token.call_args_list)
        assert first != second


class TestResetPassword:
    @pytest.fixture(autouse=True)
    def _frozen_clock(self, time_machine):
        time_machine.move_to(NOW, tick=False)

    def _reset(self, db, password: str = "new-password"):
        return router.reset_password(body=ResetPasswordRequest(token="tok", password=password), db=db)

    def test_unknown_token_is_rejected(self, auth, db):
        auth.get_password_reset_token.return_value = None

        with pytest.raises(HTTPException) as exc:
            self._reset(db)

        assert exc.value.status_code == 400
        auth.update_user_password.assert_not_called()

    def test_already_used_token_is_rejected(self, auth, db):
        auth.get_password_reset_token.return_value = reset_row(NOW + timedelta(minutes=30), used_at=NOW)

        with pytest.raises(HTTPException) as exc:
            self._reset(db)

        assert exc.value.status_code == 400
        auth.update_user_password.assert_not_called()

    def test_expired_token_is_rejected(self, auth, db):
        auth.get_password_reset_token.return_value = reset_row(NOW - timedelta(seconds=1))

        with pytest.raises(HTTPException) as exc:
            self._reset(db)

        assert exc.value.status_code == 400
        auth.update_user_password.assert_not_called()

    def test_naive_expiry_from_the_database_is_treated_as_utc(self, auth, db):
        naive_future = (NOW + timedelta(minutes=5)).replace(tzinfo=None)
        auth.get_password_reset_token.return_value = reset_row(naive_future)

        response = self._reset(db)

        assert response.message == "Password updated"

    def test_naive_expired_token_is_rejected(self, auth, db):
        naive_past = (NOW - timedelta(minutes=5)).replace(tzinfo=None)
        auth.get_password_reset_token.return_value = reset_row(naive_past)

        with pytest.raises(HTTPException):
            self._reset(db)

    def test_valid_token_stores_a_hash_and_marks_the_token_used(self, auth, db):
        auth.get_password_reset_token.return_value = reset_row(NOW + timedelta(minutes=30))

        self._reset(db, password="new-password")

        _, user_id, stored_hash = auth.update_user_password.call_args.args
        assert user_id == 1
        assert stored_hash != "new-password"
        assert verify_password("new-password", stored_hash)
        auth.mark_token_used.assert_called_once_with(db, "tok")
