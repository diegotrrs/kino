from psycopg2.extensions import connection

from ..auth import hash_password
from ..schemas.user import UserCreate


def get_user(db: connection, user_id: int) -> dict | None:
    with db.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cur.fetchone()


def get_user_by_email(db: connection, email: str) -> dict | None:
    with db.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cur.fetchone()


def get_users(db: connection, skip: int = 0, limit: int = 100) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            "SELECT * FROM users ORDER BY id OFFSET %s LIMIT %s",
            (skip, limit),
        )
        return cur.fetchall()


def create_user(db: connection, user: UserCreate) -> dict:
    data = user.model_dump()
    data["password_hash"] = hash_password(data.pop("password"))
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (%(name)s, %(email)s, %(password_hash)s)
            RETURNING *
            """,
            data,
        )
        row = cur.fetchone()
        db.commit()
        return row


def delete_user(db: connection, user_id: int) -> bool:
    with db.cursor() as cur:
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        deleted = cur.rowcount > 0
        db.commit()
        return deleted
