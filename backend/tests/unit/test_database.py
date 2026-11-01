from unittest.mock import MagicMock, patch

import pytest

from app.database import _get_live_conn, get_db


class TestGetLiveConn:
    def test_healthy_connection_is_returned_as_is(self):
        pool = MagicMock()
        conn = pool.getconn.return_value

        assert _get_live_conn(pool) is conn
        pool.putconn.assert_not_called()

    def test_stale_connection_is_closed_and_replaced(self):
        stale, fresh = MagicMock(), MagicMock()
        stale.cursor.return_value.execute.side_effect = Exception("server closed the connection unexpectedly")
        pool = MagicMock()
        pool.getconn.side_effect = [stale, fresh]

        assert _get_live_conn(pool) is fresh
        pool.putconn.assert_called_once_with(stale, close=True)


class TestGetDb:
    @pytest.fixture
    def pool(self):
        pool = MagicMock()
        with (
            patch("app.database.get_pool", return_value=pool),
            patch("app.database._get_live_conn", return_value="conn"),
        ):
            yield pool

    def test_connection_is_returned_to_the_pool_after_the_request(self, pool):
        gen = get_db()
        assert next(gen) == "conn"

        with pytest.raises(StopIteration):
            next(gen)

        pool.putconn.assert_called_once_with("conn")

    def test_connection_is_returned_to_the_pool_when_the_request_fails(self, pool):
        gen = get_db()
        next(gen)

        with pytest.raises(RuntimeError):
            gen.throw(RuntimeError("handler blew up"))

        pool.putconn.assert_called_once_with("conn")
