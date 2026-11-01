from psycopg2.extensions import connection

from ..schemas.event import EventCreate, EventUpdate

_LINKS_AGG = """
    COALESCE(
        json_agg(
            json_build_object(
                'id', el.id,
                'event_id', el.event_id,
                'url', el.url,
                'title', el.title,
                'created_at', el.created_at
            ) ORDER BY el.id
        ) FILTER (WHERE el.id IS NOT NULL),
        '[]'
    ) AS links
"""

_EXPENSES_AGG = """
    COALESCE(
        json_agg(
            json_build_object(
                'id',         ec.id,
                'event_id',   ec.event_id,
                'label',      ec.label,
                'amount',     ec.amount,
                'currency',   ec.currency,
                'created_at', ec.created_at
            ) ORDER BY ec.id
        ) FILTER (WHERE ec.id IS NOT NULL),
        '[]'
    ) AS expenses
"""


def get_event(db: connection, event_id: int) -> dict | None:
    with db.cursor() as cur:
        cur.execute(
            f"""
            SELECT e.*, c.uuid AS calendar_uuid, {_LINKS_AGG}, {_EXPENSES_AGG}
            FROM events e
            JOIN calendars c ON c.id = e.calendar_id
            LEFT JOIN event_links el ON el.event_id = e.id
            LEFT JOIN event_expenses ec ON ec.event_id = e.id
            WHERE e.id = %s
            GROUP BY e.id, c.uuid
            """,
            (event_id,),
        )
        return cur.fetchone()


def get_events(db: connection, user_id: int, skip: int = 0, limit: int = 100) -> list[dict]:
    """Events from every calendar the user is a member of."""
    with db.cursor() as cur:
        cur.execute(
            f"""
            SELECT e.*, c.uuid AS calendar_uuid, {_LINKS_AGG}, {_EXPENSES_AGG}
            FROM events e
            JOIN calendars c ON c.id = e.calendar_id
            JOIN calendar_users cu ON cu.calendar_id = e.calendar_id AND cu.user_id = %s
            LEFT JOIN event_links el ON el.event_id = e.id
            LEFT JOIN event_expenses ec ON ec.event_id = e.id
            GROUP BY e.id, c.uuid
            ORDER BY e.date, e.start_time
            OFFSET %s LIMIT %s
            """,
            (user_id, skip, limit),
        )
        return cur.fetchall()


def get_events_by_calendar(
    db: connection, calendar_id: int, skip: int = 0, limit: int = 100
) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            f"""
            SELECT e.*, c.uuid AS calendar_uuid, {_LINKS_AGG}, {_EXPENSES_AGG}
            FROM events e
            JOIN calendars c ON c.id = e.calendar_id
            LEFT JOIN event_links el ON el.event_id = e.id
            LEFT JOIN event_expenses ec ON ec.event_id = e.id
            WHERE e.calendar_id = %s
            GROUP BY e.id, c.uuid
            ORDER BY e.date, e.start_time
            OFFSET %s LIMIT %s
            """,
            (calendar_id, skip, limit),
        )
        return cur.fetchall()


def create_event(db: connection, event: EventCreate) -> dict:
    data = event.model_dump()
    with db.cursor() as cur:
        cur.execute(
            """
            WITH new_event AS (
                INSERT INTO events
                    (calendar_id, title, description, date, start_time,
                     end_date, end_time, location, color)
                VALUES
                    (%(calendar_id)s, %(title)s, %(description)s, %(date)s,
                     %(start_time)s, %(end_date)s, %(end_time)s, %(location)s, %(color)s)
                RETURNING *
            )
            SELECT ne.*, c.uuid AS calendar_uuid
            FROM new_event ne
            JOIN calendars c ON c.id = ne.calendar_id
            """,
            data,
        )
        row = cur.fetchone()
        db.commit()
    row["links"] = []
    row["expenses"] = []
    return row


def update_event(db: connection, event_id: int, event: EventUpdate) -> dict | None:
    update_data = event.model_dump(exclude_unset=True)
    if not update_data:
        return get_event(db, event_id)

    set_clause = ", ".join(f"{key} = %({key})s" for key in update_data)
    update_data["id"] = event_id

    with db.cursor() as cur:
        cur.execute(
            f"UPDATE events SET {set_clause},"
            " updated_at = NOW()"
            " WHERE id = %(id)s RETURNING id",
            update_data,
        )
        db.commit()
    return get_event(db, event_id)


def delete_event(db: connection, event_id: int) -> bool:
    with db.cursor() as cur:
        cur.execute("DELETE FROM events WHERE id = %s", (event_id,))
        deleted = cur.rowcount > 0
        db.commit()
        return deleted


def create_event_link(db: connection, event_id: int, url: str, title: str) -> dict:
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO event_links (event_id, url, title)
            VALUES (%s, %s, %s)
            RETURNING *
            """,
            (event_id, url, title),
        )
        row = cur.fetchone()
        db.commit()
        return row


def delete_event_link(db: connection, link_id: int, event_id: int) -> bool:
    with db.cursor() as cur:
        cur.execute(
            "DELETE FROM event_links WHERE id = %s AND event_id = %s",
            (link_id, event_id),
        )
        deleted = cur.rowcount > 0
        db.commit()
        return deleted


def create_event_expense(
    db: connection, event_id: int, label: str, amount: float, currency: str
) -> dict:
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO event_expenses (event_id, label, amount, currency)
            VALUES (%s, %s, %s, %s)
            RETURNING *
            """,
            (event_id, label, amount, currency),
        )
        row = cur.fetchone()
        db.commit()
        return row


def delete_event_expense(db: connection, expense_id: int, event_id: int) -> bool:
    with db.cursor() as cur:
        cur.execute(
            "DELETE FROM event_expenses WHERE id = %s AND event_id = %s",
            (expense_id, event_id),
        )
        deleted = cur.rowcount > 0
        db.commit()
        return deleted
