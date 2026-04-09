import logging

import resend

from .config import get_settings

logger = logging.getLogger(__name__)


def send_calendar_invite_email(
    to_email: str, calendar_name: str, inviter_name: str
) -> None:
    settings = get_settings()
    resend.api_key = settings.resend_api_key
    resend.Emails.send(
        {
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": f'{inviter_name} invited you to "{calendar_name}" on Kino Calendars',
            "html": (
                f"<p>Hi,</p>"
                f"<p><strong>{inviter_name}</strong> has invited you to collaborate on "
                f"<strong>{calendar_name}</strong> on Kino.</p>"
                f'<p><a href="{settings.app_base_url}/home">Log in to Kino Calendars to view the calendar.</a></p>'
            ),
        }
    )
