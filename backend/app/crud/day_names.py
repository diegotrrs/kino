from datetime import date

from psycopg2.extensions import connection


def get_day_names(db: connection, calendar_id: int) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            "SELECT date, name FROM calendar_day_names WHERE calendar_id = %s ORDER BY date",
            (calendar_id,),
        )
        return cur.fetchall()


def set_day_name(db: connection, calendar_id: int, day: date, name: str) -> dict:
    """Create or replace the name of one day of a calendar."""
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO calendar_day_names (calendar_id, date, name)
            VALUES (%s, %s, %s)
            ON CONFLICT (calendar_id, date)
            DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
            RETURNING date, name
            """,
            (calendar_id, day, name),
        )
        row = cur.fetchone()
        db.commit()
        return row


def delete_day_name(db: connection, calendar_id: int, day: date) -> bool:
    with db.cursor() as cur:
        cur.execute(
            "DELETE FROM calendar_day_names WHERE calendar_id = %s AND date = %s",
            (calendar_id, day),
        )
        deleted = cur.rowcount > 0
        db.commit()
        return deleted
