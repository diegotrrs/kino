-- Feature 39, step 2 of 2: run only AFTER the new backend (which reads events.booking_reference) is
-- deployed and checked. Copies across anything the old backend wrote in between, then drops the old
-- columns. Safe to re-run: once the old columns are gone it does nothing.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'event_travel_details' AND column_name = 'booking_reference') THEN
        UPDATE events e
        SET booking_reference = t.booking_reference
        FROM event_travel_details t
        WHERE t.event_id = e.id AND t.booking_reference IS NOT NULL AND e.booking_reference IS NULL;
        ALTER TABLE event_travel_details DROP COLUMN booking_reference;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'deleted_event_travel_details' AND column_name = 'booking_reference') THEN
        UPDATE deleted_events d
        SET booking_reference = t.booking_reference
        FROM deleted_event_travel_details t
        WHERE t.event_id = d.id AND t.booking_reference IS NOT NULL AND d.booking_reference IS NULL;
        ALTER TABLE deleted_event_travel_details DROP COLUMN booking_reference;
    END IF;
END $$;
