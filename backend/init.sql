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
    -- NULL = an ordinary event (feature 23); 'stay' = a hotel, hostel, Airbnb... (feature 39)
    travel_mode VARCHAR(10) CONSTRAINT events_travel_mode_check CHECK (travel_mode IN ('flight', 'train', 'stay')),
    -- Members only: never returned to visitors of a public calendar (feature 39)
    booking_reference VARCHAR(20),
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
    travel_mode VARCHAR(10),
    booking_reference VARCHAR(20),
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

-- Day names: one optional name per day of a calendar, e.g. "Visit to Vatican" (feature 18)
CREATE TABLE IF NOT EXISTS calendar_day_names (
    calendar_id INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    name        VARCHAR(60) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    PRIMARY KEY (calendar_id, date)
);

-- Mirrors deleted_events: archived when a calendar is deleted, copied back on restore
CREATE TABLE IF NOT EXISTS deleted_calendar_day_names (
    calendar_id INTEGER NOT NULL,
    date        DATE NOT NULL,
    name        VARCHAR(60) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (calendar_id, date)
);

-- Supabase exposes public tables through its Data API; Kino's backend connects as the owner and bypasses RLS
ALTER TABLE calendar_day_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_calendar_day_names ENABLE ROW LEVEL SECURITY;

-- Trip checklist: shared to-dos for the members of a calendar (feature 22)
CREATE TABLE IF NOT EXISTS calendar_checklist_items (
    id          SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    text        VARCHAR(200) NOT NULL,
    is_done     BOOLEAN NOT NULL DEFAULT FALSE,
    position    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_calendar_checklist_items_calendar_id
    ON calendar_checklist_items(calendar_id, position);

-- Mirrors deleted_calendar_day_names: archived when a calendar is deleted, copied back on restore
CREATE TABLE IF NOT EXISTS deleted_calendar_checklist_items (
    id          INTEGER PRIMARY KEY,
    calendar_id INTEGER NOT NULL,
    text        VARCHAR(200) NOT NULL,
    is_done     BOOLEAN NOT NULL,
    position    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calendar_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_calendar_checklist_items ENABLE ROW LEVEL SECURITY;

-- Flight and train events (feature 23)
-- Ticket details, one row exactly when an event is a flight or a train (a stay has none)
CREATE TABLE IF NOT EXISTS event_travel_details (
    event_id          INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
    origin            VARCHAR(60),
    destination       VARCHAR(60),
    number            VARCHAR(10),   -- flight number (flights only)
    terminal          VARCHAR(10),   -- flights only
    gate              VARCHAR(10),   -- flights only
    coach             VARCHAR(10),   -- trains only
    seat              VARCHAR(10),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ
);

-- Mirrors deleted_events: archived when a calendar is deleted, copied back on restore
CREATE TABLE IF NOT EXISTS deleted_event_travel_details (
    event_id          INTEGER PRIMARY KEY,
    origin            VARCHAR(60),
    destination       VARCHAR(60),
    number            VARCHAR(10),
    terminal          VARCHAR(10),
    gate              VARCHAR(10),
    coach             VARCHAR(10),
    seat              VARCHAR(10),
    created_at        TIMESTAMPTZ NOT NULL,
    updated_at        TIMESTAMPTZ,
    deleted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supabase exposes public tables through its Data API; Kino's backend connects as the owner and bypasses RLS
ALTER TABLE event_travel_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_event_travel_details ENABLE ROW LEVEL SECURITY;

-- Seed wishlist items
INSERT INTO wishlist (title, description) VALUES
    ('Event reminders', 'Receive email or push notifications before an event'),
    ('Collaborative availability', 'Show when all calendar members are free to plan group events');

-- Seed default user and calendar
INSERT INTO users (name, email, password_hash) VALUES ('Default User', 'user@kino.dev', '$2b$12$6ERPYvHCD1pvZkzXimIeZu7VeCFpxFlqaUf4mbPis768E/YSzo9VC');
INSERT INTO calendars (name, created_by) VALUES ('My Calendar', 1);
INSERT INTO calendar_users (calendar_id, user_id, role) VALUES (1, 1, 'owner');
