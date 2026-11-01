import logging
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.routers import calendars as router
from app.schemas.calendar import (
    CalendarCreate,
    CalendarExpenseCreate,
    CalendarFavouriteUpdate,
    CalendarInvite,
    CalendarUpdate,
    CalendarUserAdd,
)
from tests.unit.helpers import make_mock_db

CALENDAR_ID = 9
UUID = "cal-uuid"

# (handler, extra kwargs, crud function that must not run when rejected)
OWNER_ONLY_HANDLERS = [
    pytest.param(router.update_calendar, {"calendar": CalendarUpdate(name="New")}, "update_calendar", id="update"),
    pytest.param(router.delete_calendar, {}, "delete_calendar", id="delete"),
    pytest.param(
        router.invite_user, {"body": CalendarInvite(email="leo@example.com")}, "invite_user_to_calendar", id="invite"
    ),
    pytest.param(router.add_calendar_user, {"body": CalendarUserAdd(user_id=2)}, "add_user_to_calendar", id="add_user"),
    pytest.param(router.remove_calendar_user, {"user_id": 2}, "remove_user_from_calendar", id="remove_user"),
]

MEMBER_HANDLERS = [
    pytest.param(router.list_calendar_users, {}, "get_calendar_users", id="list_users"),
    pytest.param(
        router.create_calendar_expense,
        {"expense": CalendarExpenseCreate(label="Insurance", amount=62, currency="GBP")},
        "create_calendar_expense",
        id="create_expense",
    ),
    pytest.param(router.delete_calendar_expense, {"expense_id": 3}, "delete_calendar_expense", id="delete_expense"),
]

# Handlers readable by anyone for public calendars, members only for private ones
PUBLIC_READ_HANDLERS = [
    pytest.param(router.get_calendar, None, id="get_calendar"),
    pytest.param(router.list_calendar_expenses, "get_calendar_expenses", id="list_expenses"),
]


@pytest.fixture
def crud():
    with patch("app.routers.calendars.crud") as mock_crud:
        yield mock_crud


@pytest.fixture
def resolved_id():
    """Skip the UUID lookup: every handler resolves the calendar to CALENDAR_ID."""
    with patch("app.routers.calendars._get_id_by_uuid", return_value=CALENDAR_ID) as mock_resolve:
        yield mock_resolve


class TestOwnerOnlyActions:
    @pytest.mark.parametrize("role", [None, "editor"])
    @pytest.mark.parametrize("handler, kwargs, mutation", OWNER_ONLY_HANDLERS)
    def test_non_owner_is_rejected_with_403(self, crud, resolved_id, db, user, handler, kwargs, mutation, role):
        crud.get_user_role.return_value = role

        with pytest.raises(HTTPException) as exc:
            handler(calendar_uuid=UUID, db=db, current_user=user, **kwargs)

        assert exc.value.status_code == 403
        crud.get_user_role.assert_called_once_with(db, CALENDAR_ID, user["id"])
        getattr(crud, mutation).assert_not_called()

    def test_owner_can_delete_calendar(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "owner"
        crud.delete_calendar.return_value = True

        router.delete_calendar(calendar_uuid=UUID, db=db, current_user=user)

        crud.delete_calendar.assert_called_once_with(db, CALENDAR_ID)

    def test_delete_returns_404_when_nothing_was_deleted(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "owner"
        crud.delete_calendar.return_value = False

        with pytest.raises(HTTPException) as exc:
            router.delete_calendar(calendar_uuid=UUID, db=db, current_user=user)

        assert exc.value.status_code == 404

    def test_update_returns_404_when_calendar_vanished(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "owner"
        crud.update_calendar.return_value = None

        with pytest.raises(HTTPException) as exc:
            router.update_calendar(calendar_uuid=UUID, calendar=CalendarUpdate(name="x"), db=db, current_user=user)

        assert exc.value.status_code == 404

    def test_adding_existing_member_returns_409(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "owner"
        crud.add_user_to_calendar.return_value = None

        with pytest.raises(HTTPException) as exc:
            router.add_calendar_user(calendar_uuid=UUID, body=CalendarUserAdd(user_id=2), db=db, current_user=user)

        assert exc.value.status_code == 409

    def test_removing_non_member_returns_404(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "owner"
        crud.remove_user_from_calendar.return_value = False

        with pytest.raises(HTTPException) as exc:
            router.remove_calendar_user(calendar_uuid=UUID, user_id=2, db=db, current_user=user)

        assert exc.value.status_code == 404

    @pytest.mark.xfail(strict=True, reason="Bug: owner can remove themselves and orphan the calendar")
    def test_owner_cannot_remove_themselves(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "owner"

        with pytest.raises(HTTPException):
            router.remove_calendar_user(calendar_uuid=UUID, user_id=user["id"], db=db, current_user=user)

        crud.remove_user_from_calendar.assert_not_called()


class TestMemberActions:
    @pytest.mark.parametrize("handler, kwargs, mutation", MEMBER_HANDLERS)
    def test_non_member_is_rejected_with_403(self, crud, resolved_id, db, user, handler, kwargs, mutation):
        crud.get_user_role.return_value = None

        with pytest.raises(HTTPException) as exc:
            handler(calendar_uuid=UUID, db=db, current_user=user, **kwargs)

        assert exc.value.status_code == 403
        getattr(crud, mutation).assert_not_called()

    @pytest.mark.parametrize("role", ["editor", "owner"])
    @pytest.mark.parametrize("handler, kwargs, mutation", MEMBER_HANDLERS)
    def test_member_is_allowed(self, crud, resolved_id, db, user, handler, kwargs, mutation, role):
        crud.get_user_role.return_value = role

        handler(calendar_uuid=UUID, db=db, current_user=user, **kwargs)

        getattr(crud, mutation).assert_called_once()

    def test_deleting_unknown_expense_returns_404(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "editor"
        crud.delete_calendar_expense.return_value = False

        with pytest.raises(HTTPException) as exc:
            router.delete_calendar_expense(calendar_uuid=UUID, expense_id=3, db=db, current_user=user)

        assert exc.value.status_code == 404
        crud.delete_calendar_expense.assert_called_once_with(db, 3, CALENDAR_ID)


class TestPublicOrMemberReads:
    @pytest.mark.parametrize("handler, read", PUBLIC_READ_HANDLERS)
    def test_unknown_calendar_returns_404(self, crud, db, user, handler, read):
        crud.get_calendar_by_uuid.return_value = None

        with pytest.raises(HTTPException) as exc:
            handler(calendar_uuid=UUID, db=db, current_user=user)

        assert exc.value.status_code == 404

    @pytest.mark.parametrize("handler, read", PUBLIC_READ_HANDLERS)
    def test_private_calendar_rejects_anonymous_user(self, crud, db, handler, read):
        crud.get_calendar_by_uuid.return_value = {"id": CALENDAR_ID, "is_public": False, "role": None}

        with pytest.raises(HTTPException) as exc:
            handler(calendar_uuid=UUID, db=db, current_user=None)

        assert exc.value.status_code == 403
        crud.get_calendar_by_uuid.assert_called_once_with(db, UUID, None)

    @pytest.mark.parametrize("handler, read", PUBLIC_READ_HANDLERS)
    def test_private_calendar_rejects_non_member(self, crud, db, user, handler, read):
        crud.get_calendar_by_uuid.return_value = {"id": CALENDAR_ID, "is_public": False, "role": None}

        with pytest.raises(HTTPException) as exc:
            handler(calendar_uuid=UUID, db=db, current_user=user)

        assert exc.value.status_code == 403
        if read:
            getattr(crud, read).assert_not_called()

    @pytest.mark.parametrize("handler, read", PUBLIC_READ_HANDLERS)
    def test_private_calendar_is_readable_by_member(self, crud, db, user, handler, read):
        crud.get_calendar_by_uuid.return_value = {"id": CALENDAR_ID, "is_public": False, "role": "editor"}

        handler(calendar_uuid=UUID, db=db, current_user=user)

        crud.get_calendar_by_uuid.assert_called_once_with(db, UUID, user["id"])
        if read:
            getattr(crud, read).assert_called_once_with(db, CALENDAR_ID)

    @pytest.mark.parametrize("handler, read", PUBLIC_READ_HANDLERS)
    def test_public_calendar_is_readable_by_anonymous_user(self, crud, db, handler, read):
        crud.get_calendar_by_uuid.return_value = {"id": CALENDAR_ID, "is_public": True, "role": None}

        handler(calendar_uuid=UUID, db=db, current_user=None)

        if read:
            getattr(crud, read).assert_called_once_with(db, CALENDAR_ID)


class TestCreateCalendar:
    def test_created_by_is_taken_from_current_user_not_request_body(self, crud, db, user):
        calendar = CalendarCreate(name="Lisbon", created_by=999)

        router.create_calendar(calendar=calendar, db=db, current_user=user)

        created = crud.create_calendar.call_args.args[1]
        assert created.created_by == user["id"]


class TestInviteUser:
    def _setup_owner(self, crud):
        crud.get_user_role.return_value = "owner"
        crud.invite_user_to_calendar.return_value = {"calendar_id": CALENDAR_ID, "user_id": 2}
        crud.get_calendar.return_value = {"id": CALENDAR_ID, "name": "Lisbon"}
        crud.get_calendar_users.return_value = [
            {"id": 1, "name": "Ana", "email": "ana@example.com", "role": "owner"},
            {"id": 2, "name": "Leo", "email": "leo@example.com", "role": "editor"},
        ]

    def test_unknown_email_or_existing_member_returns_404(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "owner"
        crud.invite_user_to_calendar.return_value = None

        with pytest.raises(HTTPException) as exc:
            router.invite_user(calendar_uuid=UUID, body=CalendarInvite(email="x@example.com"), db=db, current_user=user)

        assert exc.value.status_code == 404

    def test_successful_invite_emails_the_invitee_and_returns_the_member(self, crud, resolved_id, user):
        self._setup_owner(crud)
        db = make_mock_db(row={"id": 2})

        with patch("app.routers.calendars.send_calendar_invite_email") as send:
            member = router.invite_user(
                calendar_uuid=UUID, body=CalendarInvite(email="leo@example.com"), db=db, current_user=user
            )

        send.assert_called_once_with(to_email="leo@example.com", calendar_name="Lisbon", inviter_name="Ana")
        assert member["id"] == 2

    def test_email_failure_does_not_fail_the_invite(self, crud, resolved_id, user, caplog):
        self._setup_owner(crud)
        db = make_mock_db(row={"id": 2})

        with (
            patch("app.routers.calendars.send_calendar_invite_email", side_effect=RuntimeError("Resend down")),
            caplog.at_level(logging.ERROR),
        ):
            member = router.invite_user(
                calendar_uuid=UUID, body=CalendarInvite(email="leo@example.com"), db=db, current_user=user
            )

        assert member["email"] == "leo@example.com"
        assert "Failed to send invite email" in caplog.text


class TestFavouriteAndRestore:
    def test_favouriting_calendar_user_cannot_access_returns_404(self, crud, resolved_id, db, user):
        crud.set_calendar_favourite.return_value = False

        with pytest.raises(HTTPException) as exc:
            router.toggle_calendar_favourite(
                calendar_uuid=UUID, body=CalendarFavouriteUpdate(is_favourite=True), db=db, current_user=user
            )

        assert exc.value.status_code == 404

    def test_restoring_unknown_deleted_calendar_returns_404(self, crud, user):
        with pytest.raises(HTTPException) as exc:
            router.restore_calendar(calendar_uuid=UUID, db=make_mock_db(row=None), current_user=user)

        assert exc.value.status_code == 404
        crud.restore_calendar.assert_not_called()

    def test_restoring_someone_elses_calendar_returns_404(self, crud, user):
        crud.restore_calendar.return_value = False
        db = make_mock_db(row={"id": CALENDAR_ID})

        with pytest.raises(HTTPException) as exc:
            router.restore_calendar(calendar_uuid=UUID, db=db, current_user=user)

        assert exc.value.status_code == 404
        crud.restore_calendar.assert_called_once_with(db, CALENDAR_ID, user["id"])


class TestGetIdByUuid:
    def test_unknown_uuid_raises_404(self):
        with pytest.raises(HTTPException) as exc:
            router._get_id_by_uuid(make_mock_db(row=None), UUID)

        assert exc.value.status_code == 404

    def test_known_uuid_returns_id(self):
        assert router._get_id_by_uuid(make_mock_db(row={"id": CALENDAR_ID}), UUID) == CALENDAR_ID
