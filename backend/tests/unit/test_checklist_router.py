from unittest.mock import patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.routers import calendars as router
from app.schemas.checklist import MAX_CHECKLIST_ITEMS, ChecklistItemCreate, ChecklistItemUpdate

CALENDAR_ID = 9
UUID = "cal-uuid"

# (handler, extra kwargs, crud function that must not run when rejected)
CHECKLIST_HANDLERS = [
    pytest.param(router.list_checklist_items, {}, "get_checklist_items", id="list"),
    pytest.param(
        router.create_checklist_item,
        {"body": ChecklistItemCreate(text="Buy travel insurance")},
        "create_checklist_item",
        id="create",
    ),
    pytest.param(
        router.update_checklist_item,
        {"item_id": 4, "body": ChecklistItemUpdate(is_done=True)},
        "update_checklist_item",
        id="update",
    ),
]


@pytest.fixture
def crud():
    with patch("app.routers.calendars.crud") as mock_crud:
        mock_crud.count_checklist_items.return_value = 0
        yield mock_crud


@pytest.fixture
def resolved_id():
    """Skip the UUID lookup: every handler resolves the calendar to CALENDAR_ID."""
    with patch("app.routers.calendars._get_id_by_uuid", return_value=CALENDAR_ID) as mock_resolve:
        yield mock_resolve


class TestChecklistPermissions:
    @pytest.mark.parametrize("handler, kwargs, crud_call", CHECKLIST_HANDLERS)
    def test_non_member_is_rejected_with_403(self, crud, resolved_id, db, user, handler, kwargs, crud_call):
        crud.get_user_role.return_value = None

        with pytest.raises(HTTPException) as exc:
            handler(calendar_uuid=UUID, db=db, current_user=user, **kwargs)

        assert exc.value.status_code == 403
        getattr(crud, crud_call).assert_not_called()

    @pytest.mark.parametrize("role", ["editor", "owner"])
    @pytest.mark.parametrize("handler, kwargs, crud_call", CHECKLIST_HANDLERS)
    def test_member_is_allowed(self, crud, resolved_id, db, user, handler, kwargs, crud_call, role):
        crud.get_user_role.return_value = role

        handler(calendar_uuid=UUID, db=db, current_user=user, **kwargs)

        getattr(crud, crud_call).assert_called_once()


class TestCreateChecklistItem:
    def test_full_checklist_is_rejected_with_409(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "editor"
        crud.count_checklist_items.return_value = MAX_CHECKLIST_ITEMS

        with pytest.raises(HTTPException) as exc:
            router.create_checklist_item(
                calendar_uuid=UUID, body=ChecklistItemCreate(text="One too many"), db=db, current_user=user
            )

        assert exc.value.status_code == 409
        crud.create_checklist_item.assert_not_called()

    def test_item_is_created_in_the_resolved_calendar(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "owner"

        router.create_checklist_item(
            calendar_uuid=UUID, body=ChecklistItemCreate(text="Book airport transfer"), db=db, current_user=user
        )

        crud.create_checklist_item.assert_called_once_with(db, CALENDAR_ID, "Book airport transfer")


class TestChecklistItemCreate:
    def test_html_tags_are_stripped_and_text_is_trimmed(self):
        assert ChecklistItemCreate(text="  <b>Renew</b> passport ").text == "Renew passport"

    @pytest.mark.parametrize("text", ["", "   ", "<i></i>"], ids=["empty", "whitespace", "only-tags"])
    def test_blank_text_is_rejected(self, text):
        with pytest.raises(ValidationError):
            ChecklistItemCreate(text=text)

    def test_text_longer_than_200_characters_is_rejected(self):
        with pytest.raises(ValidationError):
            ChecklistItemCreate(text="x" * 201)

    def test_text_of_exactly_200_characters_is_accepted(self):
        assert len(ChecklistItemCreate(text="x" * 200).text) == 200


class TestUpdateChecklistItem:
    def test_item_from_another_calendar_returns_404(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "editor"
        crud.update_checklist_item.return_value = None

        with pytest.raises(HTTPException) as exc:
            router.update_checklist_item(
                calendar_uuid=UUID, item_id=4, body=ChecklistItemUpdate(is_done=True), db=db, current_user=user
            )

        assert exc.value.status_code == 404

    def test_only_the_fields_sent_are_updated(self, crud, resolved_id, db, user):
        crud.get_user_role.return_value = "editor"

        router.update_checklist_item(
            calendar_uuid=UUID, item_id=4, body=ChecklistItemUpdate(text="Renew passport"), db=db, current_user=user
        )

        crud.update_checklist_item.assert_called_once_with(db, CALENDAR_ID, 4, {"text": "Renew passport"})


class TestChecklistItemUpdate:
    def test_text_is_cleaned_like_on_create(self):
        assert ChecklistItemUpdate(text=" <b>Renew</b> passport ").text == "Renew passport"

    @pytest.mark.parametrize("body", [{}, {"text": None}, {"is_done": None}, {"text": "  "}], ids=str)
    def test_empty_or_null_changes_are_rejected(self, body):
        with pytest.raises(ValidationError):
            ChecklistItemUpdate(**body)
