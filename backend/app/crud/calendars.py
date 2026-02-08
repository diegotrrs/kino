from psycopg2.extensions import connection

from ..schemas.calendar import CalendarCreate, CalendarUpdate


def get_calendar(db: connection, calendar_id: int) -> dict | None:
    with db.cursor() as cur:
        cur.execute("SELECT * FROM calendars WHERE id = %s", (calendar_id,))
        return cur.fetchone()


def get_calendars(db: connection, skip: int = 0, limit: int = 100) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            "SELECT * FROM calendars ORDER BY id OFFSET %s LIMIT %s",
            (skip, limit),
        )
        return cur.fetchall()


def create_calendar(db: connection, calendar: CalendarCreate) -> dict:
    data = calendar.model_dump()
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO calendars (name, created_by)
            VALUES (%(name)s, %(created_by)s)
            RETURNING *
            """,
            data,
        )
        row = cur.fetchone()
        db.commit()
        return row


def update_calendar(
    db: connection, calendar_id: int, calendar: CalendarUpdate
) -> dict | None:
    update_data = calendar.model_dump(exclude_unset=True)
    if not update_data:
        return get_calendar(db, calendar_id)

    set_clause = ", ".join(f"{key} = %({key})s" for key in update_data)
    update_data["id"] = calendar_id

    with db.cursor() as cur:
        cur.execute(
            f"UPDATE calendars SET {set_clause},"
            " updated_at = NOW()"
            " WHERE id = %(id)s RETURNING *",
            update_data,
        )
        row = cur.fetchone()
        db.commit()
        return row


def delete_calendar(db: connection, calendar_id: int) -> bool:
    with db.cursor() as cur:
        cur.execute("DELETE FROM calendars WHERE id = %s", (calendar_id,))
        deleted = cur.rowcount > 0
        db.commit()
        return deleted


def add_user_to_calendar(
    db: connection, calendar_id: int, user_id: int
) -> dict | None:
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO calendar_users (calendar_id, user_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            RETURNING *
            """,
            (calendar_id, user_id),
        )
        row = cur.fetchone()
        db.commit()
        return row


def remove_user_from_calendar(
    db: connection, calendar_id: int, user_id: int
) -> bool:
    with db.cursor() as cur:
        cur.execute(
            "DELETE FROM calendar_users WHERE calendar_id = %s AND user_id = %s",
            (calendar_id, user_id),
        )
        deleted = cur.rowcount > 0
        db.commit()
        return deleted


def get_calendar_users(db: connection, calendar_id: int) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT u.* FROM users u
            JOIN calendar_users cu ON u.id = cu.user_id
            WHERE cu.calendar_id = %s
            ORDER BY u.id
            """,
            (calendar_id,),
        )
        return cur.fetchall()
