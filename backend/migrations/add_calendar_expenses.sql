CREATE TABLE IF NOT EXISTS calendar_expenses (
    id          SERIAL PRIMARY KEY,
    calendar_id INTEGER NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    label       VARCHAR(255) NOT NULL,
    amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency    VARCHAR(3) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_expenses_calendar_id ON calendar_expenses(calendar_id);
