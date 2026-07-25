from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, Mock, patch

import jwt
import pytest
from fastapi import HTTPException

from app.auth import (
    create_access_token,
    get_current_user,
    get_optional_user,
    hash_password,
    verify_password,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_mock_db(user=None):
    """Return a mock DB connection whose cursor context manager yields a
    cursor with fetchone() returning `user`."""
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = user

    mock_db = MagicMock()
    mock_db.cursor.return_value.__enter__.return_value = mock_cursor
    return mock_db


def make_credentials(token: str):
    mock = Mock()
    mock.credentials = token
    return mock


def mock_settings(
    secret="test-secret-key-long-enough-for-hs256", expiration_minutes=1440
):
    return Mock(jwt_secret_key=secret, jwt_expiration_minutes=expiration_minutes)


# ---------------------------------------------------------------------------
# hash_password
# ---------------------------------------------------------------------------


class TestHashPassword:
    def test_output_differs_from_input(self):
        assert hash_password("mypassword") != "mypassword"

    def test_same_password_produces_different_hashes(self):
        # bcrypt includes a random salt — two hashes of the same input must differ
        assert hash_password("mypassword") != hash_password("mypassword")

    def test_returns_non_empty_string(self):
        assert len(hash_password("mypassword")) > 0


# ---------------------------------------------------------------------------
# verify_password
# ---------------------------------------------------------------------------


class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        hashed = hash_password("mypassword")
        assert verify_password("mypassword", hashed) is True

    def test_wrong_password_returns_false(self):
        hashed = hash_password("mypassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_empty_string_returns_false(self):
        hashed = hash_password("mypassword")
        assert verify_password("", hashed) is False


# ---------------------------------------------------------------------------
# create_access_token
# ---------------------------------------------------------------------------


class TestCreateAccessToken:
    @patch("app.auth.get_settings")
    def test_token_contains_sub_claim(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()
        token = create_access_token({"sub": "42"})
        payload = jwt.decode(
            token, "test-secret-key-long-enough-for-hs256", algorithms=["HS256"]
        )
        assert payload["sub"] == "42"

    @patch("app.auth.get_settings")
    def test_token_contains_expiration(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()
        token = create_access_token({"sub": "42"})
        payload = jwt.decode(
            token, "test-secret-key-long-enough-for-hs256", algorithms=["HS256"]
        )
        assert "exp" in payload

    @patch("app.auth.get_settings")
    def test_expiration_matches_configured_minutes(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings(expiration_minutes=60)
        before = datetime.now(UTC)
        token = create_access_token({"sub": "42"})
        after = datetime.now(UTC)

        payload = jwt.decode(
            token, "test-secret-key-long-enough-for-hs256", algorithms=["HS256"]
        )
        exp = datetime.fromtimestamp(payload["exp"], tz=UTC)

        assert before + timedelta(minutes=59) < exp < after + timedelta(minutes=61)

    @patch("app.auth.get_settings")
    def test_preserves_additional_claims(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()
        token = create_access_token({"sub": "42", "role": "admin"})
        payload = jwt.decode(
            token, "test-secret-key-long-enough-for-hs256", algorithms=["HS256"]
        )
        assert payload["role"] == "admin"


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------


class TestGetCurrentUser:
    @patch("app.auth.get_settings")
    def test_valid_token_returns_user(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()
        token = create_access_token({"sub": "1"})
        user = {"id": 1, "email": "test@example.com", "name": "Test"}

        result = get_current_user(
            credentials=make_credentials(token),
            db=make_mock_db(user=user),
        )

        assert result == user

    @patch("app.auth.get_settings")
    def test_expired_token_raises_401(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings(expiration_minutes=-1)
        token = create_access_token({"sub": "1"})

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(
                credentials=make_credentials(token),
                db=make_mock_db(),
            )

        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail.lower()

    @patch("app.auth.get_settings")
    def test_invalid_token_raises_401(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(
                credentials=make_credentials("not.a.valid.token"),
                db=make_mock_db(),
            )

        assert exc_info.value.status_code == 401

    @patch("app.auth.get_settings")
    def test_token_without_sub_raises_401(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()
        token = create_access_token({"data": "no-sub-here"})

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(
                credentials=make_credentials(token),
                db=make_mock_db(),
            )

        assert exc_info.value.status_code == 401

    @patch("app.auth.get_settings")
    def test_user_not_found_in_db_raises_401(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()
        token = create_access_token({"sub": "999"})

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(
                credentials=make_credentials(token),
                db=make_mock_db(user=None),
            )

        assert exc_info.value.status_code == 401


# ---------------------------------------------------------------------------
# get_optional_user
# ---------------------------------------------------------------------------


class TestGetOptionalUser:
    def test_no_credentials_returns_none(self):
        result = get_optional_user(credentials=None, db=Mock())
        assert result is None

    @patch("app.auth.get_settings")
    def test_valid_token_returns_user(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()
        token = create_access_token({"sub": "1"})
        user = {"id": 1, "email": "test@example.com"}

        result = get_optional_user(
            credentials=make_credentials(token),
            db=make_mock_db(user=user),
        )

        assert result == user

    @patch("app.auth.get_settings")
    def test_expired_token_returns_none(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings(expiration_minutes=-1)
        token = create_access_token({"sub": "1"})

        result = get_optional_user(
            credentials=make_credentials(token),
            db=make_mock_db(),
        )

        assert result is None

    @patch("app.auth.get_settings")
    def test_invalid_token_returns_none(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()

        result = get_optional_user(
            credentials=make_credentials("not.a.valid.token"),
            db=make_mock_db(),
        )

        assert result is None

    @patch("app.auth.get_settings")
    def test_token_without_sub_returns_none(self, mock_get_settings):
        mock_get_settings.return_value = mock_settings()
        token = create_access_token({"data": "no-sub-here"})

        result = get_optional_user(
            credentials=make_credentials(token),
            db=make_mock_db(),
        )

        assert result is None
