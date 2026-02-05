import psycopg2
from psycopg2.extras import RealDictCursor

from .config import get_settings

settings = get_settings()


def get_db():
    conn = psycopg2.connect(settings.database_url, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()
