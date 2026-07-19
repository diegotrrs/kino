# 1. Project description

Kino is a web application for creating and managing calendars to organise trips and events. Users can create calendars, add events, share calendars with other users, and collaborate in real time. The backend is a FastAPI REST API backed by PostgreSQL, handling authentication, calendar and event management, sharing, feedback, and email notifications via Resend.

# 2. File & Module Structure

```
app/
├── routers/      # FastAPI route handlers — thin, delegate to crud
├── crud/         # All database queries
├── schemas/      # Pydantic request/response models
├── auth.py       # JWT, password hashing, auth dependencies
├── database.py   # DB connection and dependency
├── email.py      # Email sending (Resend)
└── config.py     # Settings via pydantic-settings
```

- **Routers** should be thin — validate input, call crud, return response
- **CRUD** contains all SQL — no business logic in queries, no HTTP concerns
- **Schemas** are pure data shapes — no logic

# 3. Architecture

## Database

The database is **PostgreSQL hosted on Supabase**. Supabase exposes two connection methods — always use the right one for the job:

| Method | Port | Use for |
|---|---|---|
| Direct connection | 5432 | Migrations, manual `psql` sessions |
| Transaction pooler | 6543 | The FastAPI app (`DATABASE_URL`) |

The transaction pooler (port 6543) routes connections through **PgBouncer**, which multiplexes many app connections into a small number of real Postgres connections. This prevents exhausting Supabase's connection limit under load.

`database.py` uses `psycopg2.pool.ThreadedConnectionPool` (not a raw connection per request) so the app maintains a small pool of reused connections rather than opening a new one on every request. `minconn=2, maxconn=10`.

Never use port 5432 in the app — always 6543.

# 4. Coding Standards

See [`docs/coding-standards.md`](docs/coding-standards.md) for naming conventions, type hints, database usage, error handling, security, and more.
