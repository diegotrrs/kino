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

-- Supabase exposes public tables through its Data API; Kino's backend connects as the owner and bypasses RLS
ALTER TABLE calendar_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_calendar_checklist_items ENABLE ROW LEVEL SECURITY;
