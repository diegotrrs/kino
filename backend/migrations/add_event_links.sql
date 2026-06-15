CREATE TABLE IF NOT EXISTS event_links (
    id         SERIAL PRIMARY KEY,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url        VARCHAR(2048) NOT NULL,
    title      VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_links_event_id ON event_links(event_id);
