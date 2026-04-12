CREATE TABLE IF NOT EXISTS feedback (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_votes (
    wishlist_id INTEGER NOT NULL REFERENCES wishlist(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (wishlist_id, user_id)
);

INSERT INTO wishlist (title, description) VALUES
    ('Recurring events', 'Create events that repeat daily, weekly, or monthly'),
    ('Event reminders', 'Receive email or push notifications before an event'),
    ('Trip budget tracker', 'Attach a budget to a calendar and track expenses per event'),
    ('Collaborative availability', 'Show when all calendar members are free to plan group events'),
    ('Import/export (iCal)', 'Import and export calendars in iCal format for use with other apps'),
    ('Mobile app', 'Native iOS and Android app for managing your calendars on the go')
ON CONFLICT DO NOTHING;
