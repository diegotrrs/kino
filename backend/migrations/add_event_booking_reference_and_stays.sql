-- Feature 39, step 1 of 2: run BEFORE merging. It only adds things, so the backend that is live
-- (which still reads event_travel_details.booking_reference) keeps working. Safe to re-run.

-- Any event can have a booking reference, not just flights and trains
ALTER TABLE events ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(20);
ALTER TABLE deleted_events ADD COLUMN IF NOT EXISTS booking_reference VARCHAR(20);

-- Copy the existing flight and train references onto their events (and their archived copies)
UPDATE events e
SET booking_reference = t.booking_reference
FROM event_travel_details t
WHERE t.event_id = e.id AND t.booking_reference IS NOT NULL AND e.booking_reference IS NULL;

UPDATE deleted_events d
SET booking_reference = t.booking_reference
FROM deleted_event_travel_details t
WHERE t.event_id = d.id AND t.booking_reference IS NOT NULL AND d.booking_reference IS NULL;

-- A stay (hotel, hostel, Airbnb...) is a travel mode with no ticket details
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_travel_mode_check;
ALTER TABLE events ADD CONSTRAINT events_travel_mode_check CHECK (travel_mode IN ('flight', 'train', 'stay'));
