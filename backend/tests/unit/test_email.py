from unittest.mock import patch

import pytest

from app.email import send_calendar_invite_email, send_password_reset_email
from tests.unit.helpers import mock_settings


@pytest.fixture
def resend():
    with (
        patch("app.email.resend") as mock_resend,
        patch("app.email.get_settings", return_value=mock_settings()),
    ):
        yield mock_resend


def sent_payload(resend) -> dict:
    resend.Emails.send.assert_called_once()
    return resend.Emails.send.call_args.args[0]


class TestPasswordResetEmail:
    def test_is_sent_to_the_user_with_the_reset_link(self, resend):
        send_password_reset_email(
            to_email="ana@example.com", reset_url="http://localhost:3000/reset-password?token=abc"
        )

        payload = sent_payload(resend)
        assert payload["to"] == ["ana@example.com"]
        assert payload["from"] == "Kino <test@example.com>"
        assert 'href="http://localhost:3000/reset-password?token=abc"' in payload["html"]

    def test_uses_the_configured_api_key(self, resend):
        send_password_reset_email(to_email="ana@example.com", reset_url="http://x")

        assert resend.api_key == "re_test"


class TestCalendarInviteEmail:
    def test_subject_names_the_inviter_and_calendar(self, resend):
        send_calendar_invite_email(to_email="leo@example.com", calendar_name="Lisbon", inviter_name="Ana")

        payload = sent_payload(resend)
        assert payload["to"] == ["leo@example.com"]
        assert payload["subject"] == 'Ana invited you to "Lisbon" on Kino Calendars'

    def test_links_to_the_app(self, resend):
        send_calendar_invite_email(to_email="leo@example.com", calendar_name="Lisbon", inviter_name="Ana")

        assert 'href="http://localhost:3000/home"' in sent_payload(resend)["html"]

    def test_user_controlled_names_are_html_escaped(self, resend):
        # Regression: a calendar name could inject a link into an email sent from Kino's domain
        send_calendar_invite_email(
            to_email="leo@example.com",
            calendar_name='<a href="https://evil.example">Verify account</a>',
            inviter_name="<b>Ana</b>",
        )

        html = sent_payload(resend)["html"]
        assert "evil.example" in html  # text is kept…
        assert '<a href="https://evil.example">' not in html  # …but not as markup
        assert "&lt;a href=&quot;https://evil.example&quot;&gt;" in html
        assert "&lt;b&gt;Ana&lt;/b&gt;" in html
