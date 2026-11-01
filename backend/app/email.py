import html
import logging

import resend

from .config import get_settings

logger = logging.getLogger(__name__)


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    settings = get_settings()
    resend.api_key = settings.resend_api_key
    resend.Emails.send(
        {
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": "Reset your Kino password",
            "html": (
                "<p>Hi,</p>"
                "<p>We received a request to reset your Kino password.</p>"
                f'<p><a href="{reset_url}">Click here to reset your password</a></p>'
                "<p>This link expires in 1 hour. If you did not request a password reset, "
                "you can ignore this email.</p>"
            ),
        }
    )


def send_calendar_invite_email(
    to_email: str, calendar_name: str, inviter_name: str
) -> None:
    settings = get_settings()
    safe_inviter = html.escape(inviter_name)
    safe_calendar = html.escape(calendar_name)
    resend.api_key = settings.resend_api_key
    resend.Emails.send(
        {
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": f'{inviter_name} invited you to "{calendar_name}" on Kino Calendars',
            "html": (
                f"<p>Hi,</p>"
                f"<p><strong>{safe_inviter}</strong> has invited you to collaborate on "
                f"<strong>{safe_calendar}</strong> on Kino.</p>"
                f'<p><a href="{settings.app_base_url}/home">Log in to Kino Calendars to view the calendar.</a></p>'
            ),
        }
    )
