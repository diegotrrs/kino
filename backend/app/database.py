from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

from .config import get_settings

_pool: ThreadedConnectionPool | None = None


def get_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            dsn=settings.database_url,
            cursor_factory=RealDictCursor,
        )
    return _pool


def _get_live_conn(pool: ThreadedConnectionPool):
    # Supabase/PgBouncer drops idle connections after a timeout, but psycopg2's pool
    # keeps references to them and tries to reuse them, causing "server closed the
    # connection unexpectedly" errors. Pinging with SELECT 1 detects a stale connection
    # before it reaches a route handler, and replaces it with a fresh one.
    conn = pool.getconn()
    try:
        conn.cursor().execute("SELECT 1")
    except Exception:
        pool.putconn(conn, close=True)
        conn = pool.getconn()
    return conn


def get_db():
    pool = get_pool()
    conn = _get_live_conn(pool)
    try:
        yield conn
    finally:
        pool.putconn(conn)
