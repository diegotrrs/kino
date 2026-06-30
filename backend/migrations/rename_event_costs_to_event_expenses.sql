ALTER TABLE event_costs RENAME TO event_expenses;
ALTER INDEX idx_event_costs_event_id RENAME TO idx_event_expenses_event_id;
