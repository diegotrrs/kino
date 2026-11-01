from unittest.mock import MagicMock, Mock

TEST_JWT_SECRET = "test-secret-key-long-enough-for-hs256"


def make_mock_db(row: dict | None = None) -> MagicMock:
    """Return a mock DB connection whose cursor context manager yields a
    cursor with fetchone() returning `row`."""
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = row

    mock_db = MagicMock()
    mock_db.cursor.return_value.__enter__.return_value = mock_cursor
    return mock_db


def mock_settings(**overrides) -> Mock:
    """Settings object with safe test defaults; override any field by keyword."""
    defaults = {
        "jwt_secret_key": TEST_JWT_SECRET,
        "jwt_expiration_minutes": 1440,
        "app_base_url": "http://localhost:3000",
        "resend_api_key": "re_test",
        "resend_from_email": "Kino <test@example.com>",
        "env": "development",
        "test_reset_secret": "reset-secret",
        "test_user_id": 7,
    }
    return Mock(**{**defaults, **overrides})
