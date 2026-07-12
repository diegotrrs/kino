-- Add nullable first, backfill existing rows, then enforce NOT NULL

ALTER TABLE calendars ADD COLUMN start_date DATE;

-- Backfill from earliest event date for calendars that have events
UPDATE calendars
SET start_date = (
  SELECT MIN(e.date) FROM events e WHERE e.calendar_id = calendars.id
)
WHERE EXISTS (SELECT 1 FROM events e WHERE e.calendar_id = calendars.id);

-- Fall back to created_at date for calendars with no events
UPDATE calendars
SET start_date = created_at::date
WHERE start_date IS NULL;

ALTER TABLE calendars ALTER COLUMN start_date SET NOT NULL;

-- Also add nullable start_date to deleted_calendars (old rows won't have it, restored via COALESCE)
ALTER TABLE deleted_calendars ADD COLUMN IF NOT EXISTS start_date DATE;
