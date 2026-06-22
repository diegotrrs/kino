ALTER TABLE users
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'GBP';

CREATE TABLE IF NOT EXISTS event_costs (
    id         SERIAL PRIMARY KEY,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    label      VARCHAR(255) NOT NULL,
    amount     NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency   VARCHAR(3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_costs_event_id ON event_costs(event_id);
