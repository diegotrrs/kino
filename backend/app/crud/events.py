from psycopg2.extensions import connection

from ..schemas.event import EventCreate, EventUpdate

# Links, expenses and travel details are each read in their own subquery. Joining links and expenses
# into one GROUP BY repeated every link once per expense and every expense once per link.
_LINKS_AGG = """
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'id', el.id,
                    'event_id', el.event_id,
                    'url', el.url,
                    'title', el.title,
                    'created_at', el.created_at
                ) ORDER BY el.id
            )
            FROM event_links el
            WHERE el.event_id = e.id
        ),
        '[]'
    ) AS links
"""

_EXPENSES_AGG = """
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'id',         ec.id,
                    'event_id',   ec.event_id,
                    'label',      ec.label,
                    'amount',     ec.amount,
                    'currency',   ec.currency,
                    'created_at', ec.created_at
                ) ORDER BY ec.id
            )
            FROM event_expenses ec
            WHERE ec.event_id = e.id
        ),
        '[]'
    ) AS expenses
"""


_TRAVEL_SUBQUERY = """
    (
        SELECT json_build_object(
            'origin',            t.origin,
            'destination',       t.destination,
            'number',            t.number,
            'terminal',          t.terminal,
            'gate',              t.gate,
            'coach',             t.coach,
            'seat',              t.seat,
            'booking_reference', t.booking_reference
        )
        FROM event_travel_details t
        WHERE t.event_id = e.id
    ) AS travel
"""

TRAVEL_COLUMNS = ("origin", "destination", "number", "terminal", "gate", "coach", "seat", "booking_reference")


def set_travel_details(db: connection, event_id: int, travel_mode: str | None, travel: dict | None) -> None:
    """Replace an event's ticket details, or delete them when it has no travel mode. The caller commits."""
    with db.cursor() as cur:
        if travel_mode is None:
            cur.execute("DELETE FROM event_travel_details WHERE event_id = %s", (event_id,))
            return
        values = {column: (travel or {}).get(column) for column in TRAVEL_COLUMNS}
        cur.execute(
            """
            INSERT INTO event_travel_details
                (event_id, origin, destination, number, terminal, gate, coach, seat, booking_reference)
            VALUES
                (%(event_id)s, %(origin)s, %(destination)s, %(number)s, %(terminal)s, %(gate)s,
                 %(coach)s, %(seat)s, %(booking_reference)s)
            ON CONFLICT (event_id) DO UPDATE SET
                origin = EXCLUDED.origin, destination = EXCLUDED.destination, number = EXCLUDED.number,
                terminal = EXCLUDED.terminal, gate = EXCLUDED.gate, coach = EXCLUDED.coach,
                seat = EXCLUDED.seat, booking_reference = EXCLUDED.booking_reference, updated_at = NOW()
            """,
            values | {"event_id": event_id},
        )


def get_event(db: connection, event_id: int) -> dict | None:
    with db.cursor() as cur:
        cur.execute(
            f"""
            SELECT e.*, c.uuid AS calendar_uuid, {_LINKS_AGG}, {_EXPENSES_AGG}, {_TRAVEL_SUBQUERY}
            FROM events e
            JOIN calendars c ON c.id = e.calendar_id
            WHERE e.id = %s
            """,
            (event_id,),
        )
        return cur.fetchone()


def get_events(db: connection, user_id: int, skip: int = 0, limit: int = 100) -> list[dict]:
    """Events from every calendar the user is a member of."""
    with db.cursor() as cur:
        cur.execute(
            f"""
            SELECT e.*, c.uuid AS calendar_uuid, {_LINKS_AGG}, {_EXPENSES_AGG}, {_TRAVEL_SUBQUERY}
            FROM events e
            JOIN calendars c ON c.id = e.calendar_id
            JOIN calendar_users cu ON cu.calendar_id = e.calendar_id AND cu.user_id = %s
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
            SELECT e.*, c.uuid AS calendar_uuid, {_LINKS_AGG}, {_EXPENSES_AGG}, {_TRAVEL_SUBQUERY}
            FROM events e
            JOIN calendars c ON c.id = e.calendar_id
            WHERE e.calendar_id = %s
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
            INSERT INTO events
                (calendar_id, title, description, date, start_time,
                 end_date, end_time, location, color, travel_mode)
            VALUES
                (%(calendar_id)s, %(title)s, %(description)s, %(date)s,
                 %(start_time)s, %(end_date)s, %(end_time)s, %(location)s, %(color)s, %(travel_mode)s)
            RETURNING id
            """,
            data,
        )
        event_id = cur.fetchone()["id"]
    if event.travel_mode is not None:
        set_travel_details(db, event_id, event.travel_mode, data["travel"])
    db.commit()
    return get_event(db, event_id)


def update_event(db: connection, event_id: int, event: EventUpdate) -> dict | None:
    update_data = event.model_dump(exclude_unset=True)
    travel = update_data.pop("travel", None)
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
    # Only a request that names the travel fields changes them; a date-only drag leaves them alone
    if "travel_mode" in update_data and update_data["travel_mode"] is None:
        set_travel_details(db, event_id, None, None)
    elif "travel" in event.model_fields_set:
        set_travel_details(db, event_id, update_data["travel_mode"], travel)
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
