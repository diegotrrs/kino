# Domain Terms

Canonical terms to use consistently across code, UI, translations, database schemas, API endpoints, and documentation.

| Term | Definition | Terms to Avoid | Notes |
|------|------------|----------------|-------|
| **Trip expense** | A monetary amount associated with a trip or calendar, either tied to a specific event or to the trip as a whole. | cost, price, charge, fee | Use `expense` / `expenses` in variable names, table names, API routes, UI labels, and i18n keys. Event-level: `event_expenses`. Calendar-level: `calendar_expenses`. |
