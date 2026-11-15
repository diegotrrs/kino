from psycopg2.extensions import connection

CHECKLIST_ITEM_COLUMNS = "id, text, is_done, position, created_at, updated_at"


def get_checklist_items(db: connection, calendar_id: int) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            f"SELECT {CHECKLIST_ITEM_COLUMNS} FROM calendar_checklist_items "
            "WHERE calendar_id = %s ORDER BY position, id",
            (calendar_id,),
        )
        return cur.fetchall()


def count_checklist_items(db: connection, calendar_id: int) -> int:
    with db.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) AS count FROM calendar_checklist_items WHERE calendar_id = %s",
            (calendar_id,),
        )
        return cur.fetchone()["count"]


def create_checklist_item(db: connection, calendar_id: int, text: str) -> dict:
    """Append an item to the bottom of a calendar's checklist."""
    with db.cursor() as cur:
        cur.execute(
            f"""
            INSERT INTO calendar_checklist_items (calendar_id, text, position)
            SELECT %s, %s, COALESCE(MAX(position), -1) + 1
            FROM calendar_checklist_items WHERE calendar_id = %s
            RETURNING {CHECKLIST_ITEM_COLUMNS}
            """,
            (calendar_id, text, calendar_id),
        )
        row = cur.fetchone()
        db.commit()
        return row


# Only these columns may be changed through an update
UPDATABLE_COLUMNS = ("text", "is_done")


def update_checklist_item(db: connection, calendar_id: int, item_id: int, changes: dict) -> dict | None:
    """Apply changes to one item of a calendar; None if the item is not in that calendar."""
    columns = [column for column in UPDATABLE_COLUMNS if column in changes]
    set_clause = ", ".join([f"{column} = %({column})s" for column in columns] + ["updated_at = NOW()"])
    params = {column: changes[column] for column in columns} | {"id": item_id, "calendar_id": calendar_id}
    with db.cursor() as cur:
        cur.execute(
            f"UPDATE calendar_checklist_items SET {set_clause} "
            f"WHERE id = %(id)s AND calendar_id = %(calendar_id)s RETURNING {CHECKLIST_ITEM_COLUMNS}",
            params,
        )
        row = cur.fetchone()
        db.commit()
        return row
