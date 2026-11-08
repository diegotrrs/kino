from psycopg2.extensions import connection


def reset_test_user_data(db: connection, user_id: int) -> None:
    """
    Delete all data owned by the test user, but keep the user account itself
    so it can still log in. Intended only for e2e test setup.
    """
    with db.cursor() as cur:
        # Votes and feedback
        cur.execute("DELETE FROM wishlist_votes WHERE user_id = %s", (user_id,))
        cur.execute("DELETE FROM feedback WHERE user_id = %s", (user_id,))

        # Password reset tokens
        cur.execute("DELETE FROM password_reset_tokens WHERE user_id = %s", (user_id,))

        # Remove the test user from any calendars they were invited to (but did not own)
        cur.execute(
            """
            DELETE FROM calendar_users
            WHERE user_id = %s
              AND calendar_id NOT IN (
                  SELECT id FROM calendars WHERE created_by = %s
              )
            """,
            (user_id, user_id),
        )

        # Events belonging to the test user's calendars
        cur.execute(
            """
            DELETE FROM events
            WHERE calendar_id IN (
                SELECT id FROM calendars WHERE created_by = %s
            )
            """,
            (user_id,),
        )

        # Calendar memberships for the test user's calendars
        cur.execute(
            """
            DELETE FROM calendar_users
            WHERE calendar_id IN (
                SELECT id FROM calendars WHERE created_by = %s
            )
            """,
            (user_id,),
        )

        # Calendars owned by the test user
        cur.execute("DELETE FROM calendars WHERE created_by = %s", (user_id,))

        # Soft-deleted calendars owned by the test user, and their archived day names
        cur.execute(
            "DELETE FROM deleted_calendar_day_names WHERE calendar_id IN "
            "(SELECT id FROM deleted_calendars WHERE created_by = %s)",
            (user_id,),
        )
        cur.execute("DELETE FROM deleted_calendars WHERE created_by = %s", (user_id,))

        # Reset locale so subsequent logins don't restore a language set during tests
        cur.execute("UPDATE users SET locale = DEFAULT WHERE id = %s", (user_id,))

    db.commit()


def delete_user(db: connection, user_id: int) -> None:
    """
    Delete a user and all their data. Used to clean up accounts
    created during e2e tests.
    """
    with db.cursor() as cur:
        cur.execute("DELETE FROM wishlist_votes WHERE user_id = %s", (user_id,))
        cur.execute("DELETE FROM feedback WHERE user_id = %s", (user_id,))
        cur.execute("DELETE FROM password_reset_tokens WHERE user_id = %s", (user_id,))
        cur.execute(
            """
            DELETE FROM calendar_users
            WHERE user_id = %s
              AND calendar_id NOT IN (
                  SELECT id FROM calendars WHERE created_by = %s
              )
            """,
            (user_id, user_id),
        )
        cur.execute(
            "DELETE FROM events WHERE calendar_id IN (SELECT id FROM calendars WHERE created_by = %s)",
            (user_id,),
        )
        cur.execute(
            "DELETE FROM calendar_users WHERE calendar_id IN (SELECT id FROM calendars WHERE created_by = %s)",
            (user_id,),
        )
        cur.execute("DELETE FROM calendars WHERE created_by = %s", (user_id,))
        cur.execute(
            "DELETE FROM deleted_calendar_day_names WHERE calendar_id IN "
            "(SELECT id FROM deleted_calendars WHERE created_by = %s)",
            (user_id,),
        )
        cur.execute("DELETE FROM deleted_calendars WHERE created_by = %s", (user_id,))
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))

    db.commit()
