from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.routers import events as router
from app.schemas.event import EventCreate, EventExpenseCreate, EventLinkCreate, EventUpdate

EVENT = {"id": 5, "calendar_id": 9}

# Every handler that acts on an existing event shares the same preamble:
# 404 if the event is missing, 403 if the user is not a calendar member.
# (handler, extra kwargs, crud function that must not run when rejected)
EVENT_HANDLERS = [
    pytest.param(router.get_event, {}, None, id="get_event"),
    pytest.param(router.update_event, {"event": EventUpdate(title="New")}, "update_event", id="update_event"),
    pytest.param(router.delete_event, {}, "delete_event", id="delete_event"),
    pytest.param(
        router.create_event_link,
        {"link": EventLinkCreate(url="https://example.com")},
        "create_event_link",
        id="create_event_link",
    ),
    pytest.param(router.delete_event_link, {"link_id": 3}, "delete_event_link", id="delete_event_link"),
    pytest.param(
        router.create_event_expense,
        {"expense": EventExpenseCreate(label="Taxi", amount=12.5, currency="EUR")},
        "create_event_expense",
        id="create_event_expense",
    ),
    pytest.param(router.delete_event_expense, {"expense_id": 3}, "delete_event_expense", id="delete_event_expense"),
]


@pytest.fixture
def crud():
    with patch("app.routers.events.crud") as mock_crud:
        yield mock_crud


def call(handler, db, user, **kwargs):
    return handler(event_id=EVENT["id"], db=db, current_user=user, **kwargs)


class TestEventPermissionPreamble:
    @pytest.mark.parametrize("handler, kwargs, mutation", EVENT_HANDLERS)
    def test_missing_event_returns_404(self, crud, db, user, handler, kwargs, mutation):
        crud.get_event.return_value = None

        with pytest.raises(HTTPException) as exc:
            call(handler, db, user, **kwargs)

        assert exc.value.status_code == 404
        if mutation:
            getattr(crud, mutation).assert_not_called()

    @pytest.mark.parametrize("handler, kwargs, mutation", EVENT_HANDLERS)
    def test_non_member_is_rejected_with_403(self, crud, db, user, handler, kwargs, mutation):
        crud.get_event.return_value = EVENT
        crud.get_user_role.return_value = None

        with pytest.raises(HTTPException) as exc:
            call(handler, db, user, **kwargs)

        assert exc.value.status_code == 403
        crud.get_user_role.assert_called_once_with(db, EVENT["calendar_id"], user["id"])
        if mutation:
            getattr(crud, mutation).assert_not_called()

    @pytest.mark.parametrize("role", ["editor", "owner"])
    @pytest.mark.parametrize("handler, kwargs, mutation", EVENT_HANDLERS)
    def test_member_is_allowed(self, crud, db, user, handler, kwargs, mutation, role):
        crud.get_event.return_value = EVENT
        crud.get_user_role.return_value = role

        call(handler, db, user, **kwargs)

        if mutation:
            getattr(crud, mutation).assert_called_once()


class TestDeleteEventChildren:
    def test_deleting_unknown_link_returns_404(self, crud, db, user):
        crud.get_event.return_value = EVENT
        crud.get_user_role.return_value = "editor"
        crud.delete_event_link.return_value = False

        with pytest.raises(HTTPException) as exc:
            router.delete_event_link(event_id=5, link_id=3, db=db, current_user=user)

        assert exc.value.status_code == 404
        crud.delete_event_link.assert_called_once_with(db, 3, 5)

    def test_deleting_unknown_expense_returns_404(self, crud, db, user):
        crud.get_event.return_value = EVENT
        crud.get_user_role.return_value = "editor"
        crud.delete_event_expense.return_value = False

        with pytest.raises(HTTPException) as exc:
            router.delete_event_expense(event_id=5, expense_id=3, db=db, current_user=user)

        assert exc.value.status_code == 404
        crud.delete_event_expense.assert_called_once_with(db, 3, 5)


class TestCreateEvent:
    def _event(self) -> EventCreate:
        return EventCreate(calendar_id=9, title="Museum", date="2035-01-01", start_time="10:00")

    def test_non_member_cannot_create_event(self, crud, db, user):
        crud.get_user_role.return_value = None

        with pytest.raises(HTTPException) as exc:
            router.create_event(event=self._event(), db=db, current_user=user)

        assert exc.value.status_code == 403
        crud.create_event.assert_not_called()

    def test_member_creates_event_in_requested_calendar(self, crud, db, user):
        crud.get_user_role.return_value = "editor"
        event = self._event()

        result = router.create_event(event=event, db=db, current_user=user)

        crud.get_user_role.assert_called_once_with(db, 9, user["id"])
        crud.create_event.assert_called_once_with(db, event)
        assert result is crud.create_event.return_value


class TestListEvents:
    def _list(self, db, user, calendar_uuid=None):
        return router.list_events(skip=0, limit=100, calendar_uuid=calendar_uuid, db=db, current_user=user)

    def test_unknown_calendar_returns_404(self, crud, db, user):
        crud.get_calendar_by_uuid.return_value = None

        with pytest.raises(HTTPException) as exc:
            self._list(db, user, calendar_uuid="abc")

        assert exc.value.status_code == 404

    def test_private_calendar_rejects_anonymous_user(self, crud, db):
        crud.get_calendar_by_uuid.return_value = {"id": 9, "is_public": False, "role": None}

        with pytest.raises(HTTPException) as exc:
            self._list(db, None, calendar_uuid="abc")

        assert exc.value.status_code == 403
        crud.get_calendar_by_uuid.assert_called_once_with(db, "abc", None)
        crud.get_events_by_calendar.assert_not_called()

    def test_private_calendar_rejects_non_member(self, crud, db, user):
        crud.get_calendar_by_uuid.return_value = {"id": 9, "is_public": False, "role": None}

        with pytest.raises(HTTPException) as exc:
            self._list(db, user, calendar_uuid="abc")

        assert exc.value.status_code == 403
        crud.get_events_by_calendar.assert_not_called()

    def test_private_calendar_returns_events_to_member(self, crud, db, user):
        crud.get_calendar_by_uuid.return_value = {"id": 9, "is_public": False, "role": "editor"}

        result = self._list(db, user, calendar_uuid="abc")

        crud.get_calendar_by_uuid.assert_called_once_with(db, "abc", user["id"])
        crud.get_events_by_calendar.assert_called_once_with(db, 9, skip=0, limit=100)
        assert result is crud.get_events_by_calendar.return_value

    def test_public_calendar_returns_events_to_anonymous_user(self, crud, db):
        crud.get_calendar_by_uuid.return_value = {"id": 9, "is_public": True, "role": None}

        result = self._list(db, None, calendar_uuid="abc")

        assert result is crud.get_events_by_calendar.return_value

    def test_listing_all_events_requires_authentication(self, crud, db):
        with pytest.raises(HTTPException) as exc:
            self._list(db, None)

        assert exc.value.status_code == 401
        crud.get_events.assert_not_called()

    def test_listing_all_events_is_scoped_to_the_current_user(self, crud, db, user):
        # Regression: this used to return every user's events, private calendars included
        result = self._list(db, user)

        crud.get_events.assert_called_once_with(db, user["id"], skip=0, limit=100)
        assert result is crud.get_events.return_value
