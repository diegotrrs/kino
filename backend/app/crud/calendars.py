from psycopg2.extensions import connection

from ..schemas.calendar import CalendarCreate, CalendarUpdate


def get_calendar(db: connection, calendar_id: int, user_id: int | None = None) -> dict | None:
    with db.cursor() as cur:
        if user_id is not None:
            cur.execute(
                """
                SELECT c.*, COALESCE(cu.is_favourite, FALSE) AS is_favourite
                FROM calendars c
                LEFT JOIN calendar_users cu ON c.id = cu.calendar_id AND cu.user_id = %s
                WHERE c.id = %s
                """,
                (user_id, calendar_id),
            )
        else:
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
        cur.execute(
            "INSERT INTO calendar_users (calendar_id, user_id) VALUES (%s, %s)",
            (row["id"], data["created_by"]),
        )
        db.commit()
        return {**row, "is_favourite": False}


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


def get_calendars_by_user(db: connection, user_id: int) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT c.*, cu.is_favourite FROM calendars c
            JOIN calendar_users cu ON c.id = cu.calendar_id
            WHERE cu.user_id = %s
            ORDER BY c.id
            """,
            (user_id,),
        )
        return cur.fetchall()


def get_favourite_calendars(db: connection, user_id: int) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT c.*, cu.is_favourite FROM calendars c
            JOIN calendar_users cu ON c.id = cu.calendar_id
            WHERE cu.user_id = %s AND cu.is_favourite = TRUE
            ORDER BY c.id
            """,
            (user_id,),
        )
        return cur.fetchall()


def set_calendar_favourite(
    db: connection, calendar_id: int, user_id: int, is_favourite: bool
) -> bool:
    with db.cursor() as cur:
        cur.execute(
            """
            UPDATE calendar_users SET is_favourite = %s
            WHERE calendar_id = %s AND user_id = %s
            """,
            (is_favourite, calendar_id, user_id),
        )
        updated = cur.rowcount > 0
        db.commit()
        return updated


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
