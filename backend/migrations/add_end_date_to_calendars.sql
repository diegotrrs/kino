-- Optional end date for calendars (#47). Nullable with no backfill: calendars without one
-- keep taking their length from their events. Safe to re-run.

ALTER TABLE calendars ADD COLUMN IF NOT EXISTS end_date DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendars_end_after_start'
  ) THEN
    ALTER TABLE calendars ADD CONSTRAINT calendars_end_after_start
      CHECK (end_date IS NULL OR end_date >= start_date);
  END IF;
END $$;

ALTER TABLE deleted_calendars ADD COLUMN IF NOT EXISTS end_date DATE;
