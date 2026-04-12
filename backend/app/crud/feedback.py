from psycopg2.extensions import connection


def submit_feedback(db: connection, user_id: int, content: str) -> None:
    with db.cursor() as cur:
        cur.execute(
            "INSERT INTO feedback (user_id, content) VALUES (%s, %s)",
            (user_id, content),
        )
        db.commit()


def get_wishlist(db: connection, user_id: int) -> list[dict]:
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT w.id, w.title, w.description,
                   COUNT(v.user_id) AS vote_count,
                   COALESCE(BOOL_OR(v.user_id = %s), FALSE) AS user_has_voted
            FROM wishlist w
            LEFT JOIN wishlist_votes v ON w.id = v.wishlist_id
            GROUP BY w.id
            ORDER BY vote_count DESC, w.id
            """,
            (user_id,),
        )
        return cur.fetchall()


def add_vote(db: connection, wishlist_id: int, user_id: int) -> None:
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO wishlist_votes (wishlist_id, user_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """,
            (wishlist_id, user_id),
        )
        db.commit()


def remove_vote(db: connection, wishlist_id: int, user_id: int) -> None:
    with db.cursor() as cur:
        cur.execute(
            "DELETE FROM wishlist_votes WHERE wishlist_id = %s AND user_id = %s",
            (wishlist_id, user_id),
        )
        db.commit()
