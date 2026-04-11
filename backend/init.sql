CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
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

-- Seed default user and calendar
INSERT INTO users (name, email, password_hash) VALUES ('Default User', 'user@kino.dev', '$2b$12$6ERPYvHCD1pvZkzXimIeZu7VeCFpxFlqaUf4mbPis768E/YSzo9VC');
INSERT INTO calendars (name, created_by) VALUES ('My Calendar', 1);
INSERT INTO calendar_users (calendar_id, user_id, role) VALUES (1, 1, 'owner');
