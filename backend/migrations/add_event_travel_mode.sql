-- Flight and train events (feature 23): NULL travel_mode = an ordinary event
ALTER TABLE events ADD COLUMN IF NOT EXISTS travel_mode VARCHAR(10);
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_travel_mode_check;
ALTER TABLE events ADD CONSTRAINT events_travel_mode_check CHECK (travel_mode IN ('flight', 'train'));
ALTER TABLE deleted_events ADD COLUMN IF NOT EXISTS travel_mode VARCHAR(10);

-- Ticket details, one row exactly when an event has a travel_mode
CREATE TABLE IF NOT EXISTS event_travel_details (
    event_id          INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
    origin            VARCHAR(60),
    destination       VARCHAR(60),
    number            VARCHAR(10),   -- flight number (flights only)
    terminal          VARCHAR(10),   -- flights only
    gate              VARCHAR(10),   -- flights only
    coach             VARCHAR(10),   -- trains only
    seat              VARCHAR(10),
    booking_reference VARCHAR(20),
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
    booking_reference VARCHAR(20),
    created_at        TIMESTAMPTZ NOT NULL,
    updated_at        TIMESTAMPTZ,
    deleted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supabase exposes public tables through its Data API; Kino's backend connects as the owner and bypasses RLS
ALTER TABLE event_travel_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_event_travel_details ENABLE ROW LEVEL SECURITY;
