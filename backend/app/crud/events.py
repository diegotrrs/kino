from psycopg2.extensions import connection

from ..schemas.event import EventCreate, EventUpdate


def get_event(db: connection, event_id: int) -> dict | None:
    with db.cursor() as cur:
        cur.execute("SELECT * FROM events WHERE id = %s", (event_id,))
        return cur.fetchone()


def get_events(db: connection, skip: int = 0, limit: int = 100) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            "SELECT * FROM events ORDER BY date, start_time OFFSET %s LIMIT %s",
            (skip, limit),
        )
        return cur.fetchall()


def get_events_by_calendar(
    db: connection, calendar_id: int, skip: int = 0, limit: int = 100
) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            "SELECT * FROM events WHERE calendar_id = %s"
            " ORDER BY date, start_time OFFSET %s LIMIT %s",
            (calendar_id, skip, limit),
        )
        return cur.fetchall()


def create_event(db: connection, event: EventCreate) -> dict:
    data = event.model_dump()
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO events
                (calendar_id, title, description, date, start_time,
                 end_time, location, color)
            VALUES
                (%(calendar_id)s, %(title)s, %(description)s, %(date)s,
                 %(start_time)s, %(end_time)s, %(location)s, %(color)s)
            RETURNING *
            """,
            data,
        )
        row = cur.fetchone()
        db.commit()
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
            " WHERE id = %(id)s RETURNING *",
            update_data,
        )
        row = cur.fetchone()
        db.commit()
        return row


def delete_event(db: connection, event_id: int) -> bool:
    with db.cursor() as cur:
        cur.execute("DELETE FROM events WHERE id = %s", (event_id,))
        deleted = cur.rowcount > 0
        db.commit()
        return deleted
