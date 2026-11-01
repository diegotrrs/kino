from unittest.mock import patch

from app.crud.events import update_event
from app.crud.users import update_user
from app.schemas.event import EventUpdate
from tests.unit.helpers import make_mock_db


def executed_sql(db) -> str:
    cursor = db.cursor.return_value.__enter__.return_value
    cursor.execute.assert_called_once()
    return cursor.execute.call_args.args[0]


class TestUpdateEvent:
    def test_empty_update_runs_no_query_and_returns_current_event(self):
        db = make_mock_db()

        with patch("app.crud.events.get_event", return_value={"id": 5}) as get_event:
            assert update_event(db, 5, EventUpdate()) == {"id": 5}

        db.cursor.assert_not_called()
        get_event.assert_called_once_with(db, 5)

    def test_only_provided_fields_are_set(self):
        db = make_mock_db()

        with patch("app.crud.events.get_event"):
            update_event(db, 5, EventUpdate(title="New", color="#FFFFFF"))

        sql = executed_sql(db)
        assert "title = %(title)s" in sql
        assert "color = %(color)s" in sql
        assert "description" not in sql
        db.commit.assert_called_once()


class TestUpdateUser:
    def test_empty_update_runs_no_query_and_returns_current_user(self):
        db = make_mock_db()

        with patch("app.crud.users.get_user", return_value={"id": 1}) as get_user:
            assert update_user(db, 1, {}) == {"id": 1}

        db.cursor.assert_not_called()
        get_user.assert_called_once_with(db, 1)

    def test_only_provided_fields_are_set_and_values_are_parameterised(self):
        db = make_mock_db(row={"id": 1})

        update_user(db, 1, {"locale": "es"})

        sql = executed_sql(db)
        params = db.cursor.return_value.__enter__.return_value.execute.call_args.args[1]
        assert "locale = %(locale)s" in sql
        assert params == {"locale": "es", "id": 1}
        db.commit.assert_called_once()
