CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE calendars (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(255) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE deleted_calendars (
    id INTEGER PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE calendar_users (
    calendar_id  INTEGER     NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    user_id      INTEGER     NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    is_favourite BOOLEAN     NOT NULL DEFAULT FALSE,
    role         VARCHAR(10) NOT NULL DEFAULT 'editor',  -- 'owner' | 'editor'
    PRIMARY KEY (calendar_id, user_id)
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    calendar_id INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_date DATE,
    end_time TIME,
    location VARCHAR(255),
    color VARCHAR(7) NOT NULL DEFAULT '#AEC6E4',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS event_links (
    id         SERIAL PRIMARY KEY,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url        VARCHAR(2048) NOT NULL,
    title      VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_links_event_id ON event_links(event_id);

CREATE TABLE IF NOT EXISTS event_costs (
    id         SERIAL PRIMARY KEY,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    label      VARCHAR(255) NOT NULL,
    amount     NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency   VARCHAR(3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_costs_event_id ON event_costs(event_id);

CREATE TABLE deleted_events (
    id INTEGER PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE,
    calendar_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_date DATE,
    end_time TIME,
    location VARCHAR(255),
    color VARCHAR(7) NOT NULL DEFAULT '#AEC6E4',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Seed wishlist items
INSERT INTO wishlist (title, description) VALUES
    ('Recurring events', 'Create events that repeat daily, weekly, or monthly'),
    ('Event reminders', 'Receive email or push notifications before an event'),
    ('Trip budget tracker', 'Attach a budget to a calendar and track expenses per event'),
    ('Collaborative availability', 'Show when all calendar members are free to plan group events'),
    ('Import/export (iCal)', 'Import and export calendars in iCal format for use with other apps'),
    ('Mobile app', 'Native iOS and Android app for managing your calendars on the go');

-- Seed default user and calendar
INSERT INTO users (name, email, password_hash) VALUES ('Default User', 'user@kino.dev', '$2b$12$6ERPYvHCD1pvZkzXimIeZu7VeCFpxFlqaUf4mbPis768E/YSzo9VC');
INSERT INTO calendars (name, created_by) VALUES ('My Calendar', 1);
INSERT INTO calendar_users (calendar_id, user_id, role) VALUES (1, 1, 'owner');
