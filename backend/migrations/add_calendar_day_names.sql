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
