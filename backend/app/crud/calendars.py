from psycopg2.extensions import connection

from ..schemas.calendar import CalendarCreate, CalendarUpdate


def get_calendar(db: connection, calendar_id: int, user_id: int | None = None) -> dict | None:
    with db.cursor() as cur:
        if user_id is not None:
            cur.execute(
                """
                SELECT c.*, COALESCE(cu.is_favourite, FALSE) AS is_favourite,
                            cu.role AS role
                FROM calendars c
                LEFT JOIN calendar_users cu ON c.id = cu.calendar_id AND cu.user_id = %s
                WHERE c.id = %s
                """,
                (user_id, calendar_id),
            )
        else:
            cur.execute(
                """
                SELECT c.*, FALSE AS is_favourite, NULL AS role
                FROM calendars c
                WHERE c.id = %s
                """,
                (calendar_id,),
            )
        return cur.fetchone()


def get_calendar_by_uuid(db: connection, calendar_uuid: str, user_id: int | None = None) -> dict | None:
    with db.cursor() as cur:
        if user_id is not None:
            cur.execute(
                """
                SELECT c.*, COALESCE(cu.is_favourite, FALSE) AS is_favourite,
                            cu.role AS role
                FROM calendars c
                LEFT JOIN calendar_users cu ON c.id = cu.calendar_id AND cu.user_id = %s
                WHERE c.uuid = %s
                """,
                (user_id, calendar_uuid),
            )
        else:
            cur.execute(
                """
                SELECT c.*, FALSE AS is_favourite, NULL AS role
                FROM calendars c
                WHERE c.uuid = %s
                """,
                (calendar_uuid,),
            )
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
            "INSERT INTO calendar_users (calendar_id, user_id, role) VALUES (%s, %s, 'owner')",
            (row["id"], data["created_by"]),
        )
        db.commit()
        return {**row, "is_favourite": False, "role": "owner", "is_public": row.get("is_public", False)}


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
        # Archive calendar first (check it exists)
        cur.execute(
            """
            INSERT INTO deleted_calendars (id, uuid, name, created_by, created_at, updated_at)
            SELECT id, uuid, name, created_by, created_at, updated_at
            FROM calendars WHERE id = %s
            """,
            (calendar_id,),
        )
        if cur.rowcount == 0:
            db.rollback()
            return False
        # Archive events before deleting calendar (cascade would wipe them)
        cur.execute(
            """
            INSERT INTO deleted_events (id, uuid, calendar_id, title, description, date,
                start_time, end_date, end_time, location, color, created_at, updated_at)
            SELECT id, uuid, calendar_id, title, description, date,
                start_time, end_date, end_time, location, color, created_at, updated_at
            FROM events WHERE calendar_id = %s
            """,
            (calendar_id,),
        )
        # Delete calendar — cascade removes events and calendar_users
        cur.execute("DELETE FROM calendars WHERE id = %s", (calendar_id,))
        db.commit()
        return True


def get_deleted_calendars_by_user(db: connection, user_id: int) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM deleted_calendars
            WHERE created_by = %s
            ORDER BY deleted_at DESC
            """,
            (user_id,),
        )
        return cur.fetchall()


def restore_calendar(db: connection, calendar_id: int, user_id: int) -> bool:
    with db.cursor() as cur:
        # Restore calendar row first (events FK requires parent to exist)
        cur.execute(
            """
            INSERT INTO calendars (id, uuid, name, created_by, created_at, updated_at)
            SELECT id, uuid, name, created_by, created_at, updated_at
            FROM deleted_calendars WHERE id = %s AND created_by = %s
            """,
            (calendar_id, user_id),
        )
        if cur.rowcount == 0:
            db.rollback()
            return False
        cur.execute("DELETE FROM deleted_calendars WHERE id = %s", (calendar_id,))
        cur.execute(
            "INSERT INTO calendar_users (calendar_id, user_id, role) VALUES (%s, %s, 'owner')",
            (calendar_id, user_id),
        )
        # Restore events
        cur.execute(
            """
            INSERT INTO events (id, uuid, calendar_id, title, description, date,
                start_time, end_date, end_time, location, color, created_at, updated_at)
            SELECT id, uuid, calendar_id, title, description, date,
                start_time, end_date, end_time, location, color, created_at, updated_at
            FROM deleted_events WHERE calendar_id = %s
            """,
            (calendar_id,),
        )
        cur.execute("DELETE FROM deleted_events WHERE calendar_id = %s", (calendar_id,))
        db.commit()
        return True


def get_user_role(db: connection, calendar_id: int, user_id: int) -> str | None:
    with db.cursor() as cur:
        cur.execute(
            "SELECT role FROM calendar_users WHERE calendar_id = %s AND user_id = %s",
            (calendar_id, user_id),
        )
        row = cur.fetchone()
        return row["role"] if row else None


def invite_user_to_calendar(db: connection, calendar_id: int, email: str) -> dict | None:
    with db.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        if not user:
            return None
        cur.execute(
            """
            INSERT INTO calendar_users (calendar_id, user_id, role)
            VALUES (%s, %s, 'editor')
            ON CONFLICT DO NOTHING
            RETURNING *
            """,
            (calendar_id, user["id"]),
        )
        row = cur.fetchone()
        db.commit()
        return row


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
            SELECT c.id, c.uuid, c.name, c.is_public, c.created_by, c.created_at, c.updated_at,
                   cu.is_favourite, cu.role
            FROM calendars c
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
            SELECT c.id, c.uuid, c.name, c.is_public, c.created_by, c.created_at, c.updated_at,
                   cu.is_favourite, cu.role
            FROM calendars c
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
            SELECT u.id, u.name, u.email, cu.role FROM users u
            JOIN calendar_users cu ON u.id = cu.user_id
            WHERE cu.calendar_id = %s
            ORDER BY cu.role DESC, u.id
            """,
            (calendar_id,),
        )
        return cur.fetchall()
