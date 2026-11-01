from unittest.mock import patch

import psycopg2.errors
import pytest
from fastapi import HTTPException

from app.routers import users as router
from app.schemas.user import UserUpdate

OTHER_USER_ID = 2

# (handler, extra kwargs, crud function that must not run when rejected)
SELF_ONLY_HANDLERS = [
    pytest.param(router.get_user, {}, "get_user", id="get_user"),
    pytest.param(router.list_user_calendars, {}, "get_calendars_by_user", id="list_calendars"),
    pytest.param(router.update_user, {"body": UserUpdate(name="Eve")}, "update_user", id="update_user"),
    pytest.param(router.delete_user, {}, "delete_user", id="delete_user"),
]


@pytest.fixture
def crud():
    with patch("app.routers.users.crud") as mock_crud:
        yield mock_crud


class TestSelfOnlyAccess:
    @pytest.mark.parametrize("handler, kwargs, crud_call", SELF_ONLY_HANDLERS)
    def test_cannot_act_on_another_user(self, crud, db, user, handler, kwargs, crud_call):
        with pytest.raises(HTTPException) as exc:
            handler(user_id=OTHER_USER_ID, db=db, current_user=user, **kwargs)

        assert exc.value.status_code == 403
        getattr(crud, crud_call).assert_not_called()

    @pytest.mark.parametrize("handler, kwargs, crud_call", SELF_ONLY_HANDLERS)
    def test_can_act_on_self(self, crud, db, user, handler, kwargs, crud_call):
        handler(user_id=user["id"], db=db, current_user=user, **kwargs)

        getattr(crud, crud_call).assert_called_once()


class TestGetAndDeleteUser:
    def test_missing_user_returns_404(self, crud, db, user):
        crud.get_user.return_value = None

        with pytest.raises(HTTPException) as exc:
            router.get_user(user_id=user["id"], db=db, current_user=user)

        assert exc.value.status_code == 404

    def test_deleting_missing_user_returns_404(self, crud, db, user):
        crud.delete_user.return_value = False

        with pytest.raises(HTTPException) as exc:
            router.delete_user(user_id=user["id"], db=db, current_user=user)

        assert exc.value.status_code == 404


class TestUpdateUser:
    def test_only_fields_sent_in_the_request_are_updated(self, crud, db, user):
        router.update_user(user_id=user["id"], body=UserUpdate(name="Eve"), db=db, current_user=user)

        crud.update_user.assert_called_once_with(db, user["id"], {"name": "Eve"})

    def test_missing_user_returns_404(self, crud, db, user):
        crud.update_user.return_value = None

        with pytest.raises(HTTPException) as exc:
            router.update_user(user_id=user["id"], body=UserUpdate(name="Eve"), db=db, current_user=user)

        assert exc.value.status_code == 404

    @pytest.mark.xfail(strict=True, reason="Bug: email already in use surfaces as a 500 instead of a 409")
    def test_changing_email_to_one_already_in_use_returns_409(self, crud, db, user):
        crud.update_user.side_effect = psycopg2.errors.UniqueViolation()

        with pytest.raises(HTTPException) as exc:
            router.update_user(user_id=user["id"], body=UserUpdate(email="taken@example.com"), db=db, current_user=user)

        assert exc.value.status_code == 409
