# Kino Backend

FastAPI backend for the Kino application with PostgreSQL database.

## Prerequisites

- Python 3.11+
- Docker (for PostgreSQL)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI application entry point
│   ├── config.py         # Configuration and settings
│   ├── database.py       # Database connection setup
│   ├── schemas/          # Pydantic request/response schemas
│   ├── routers/          # API route handlers
│   └── crud/             # Database operations (raw SQL)
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

### 1. Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set up PostgreSQL with Docker

Start a PostgreSQL container (this automatically creates the `kino` database):

```bash
docker run --name kino-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=kino \
  -p 5432:5432 \
  -d postgres:14
```

#### Docker commands reference

```bash
# Check if container is running
docker ps

# Stop the container
docker stop kino-postgres

# Start the container again
docker start kino-postgres

# View container logs
docker logs kino-postgres

# Remove the container (deletes all data)
docker rm -f kino-postgres
```

#### Query the database via command line

Connect to the database using psql inside the container:

```bash
docker exec -it kino-postgres psql -U postgres -d kino
```

Common psql commands:

| Command | Description |
|---------|-------------|
| `\dt` | List all tables |
| `\d events` | Describe the events table |
| `SELECT * FROM events;` | Query all events |
| `\q` | Exit psql |

### 4. Set up pgAdmin (GUI Database Client)

pgAdmin provides a web-based interface to manage and query your PostgreSQL database.

#### Install pgAdmin with Docker

```bash
docker run --name pgadmin \
  -e PGADMIN_DEFAULT_EMAIL=admin@admin.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  -p 5050:80 \
  --link kino-postgres:postgres \
  -d dpage/pgadmin4
```

#### Access pgAdmin

1. Open http://localhost:5050 in your browser
2. Log in with:
   - Email: `admin@admin.com`
   - Password: `admin`

#### Connect to the Kino database

1. Right-click **Servers** → **Register** → **Server...**
2. In the **General** tab:
   - Name: `Kino`
3. In the **Connection** tab:
   - Host: `postgres` (or `host.docker.internal` if not using --link)
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres`
   - Check "Save password"
4. Click **Save**

#### Query data in pgAdmin

1. Expand: Servers → Kino → Databases → kino → Schemas → public → Tables
2. Right-click a table → **View/Edit Data** → **All Rows**
3. Or use the Query Tool: Right-click on `kino` database → **Query Tool**, then write SQL

### 5. Configure environment variables

```bash
cp .env.example .env
```

The default values work with the Docker setup above:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kino
DEBUG=false
```

### 6. Create the events table

Connect to the database and run the following SQL:

```bash
docker exec -it kino-postgres psql -U postgres -d kino
```

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
```

### 7. Insert seed data (optional)

```sql
INSERT INTO events (title, description, start_time, end_time, location) VALUES
    ('Team Standup', 'Daily standup meeting', '2025-02-10 09:00:00+00', '2025-02-10 09:15:00+00', 'Zoom'),
    ('Sprint Planning', 'Plan tasks for the upcoming sprint', '2025-02-10 10:00:00+00', '2025-02-10 11:30:00+00', 'Conference Room A'),
    ('Lunch Break', NULL, '2025-02-10 12:00:00+00', '2025-02-10 13:00:00+00', NULL),
    ('Code Review', 'Review pull requests for the auth module', '2025-02-10 14:00:00+00', '2025-02-10 15:00:00+00', 'Slack'),
    ('Movie Night', 'Watch "Blade Runner 2049"', '2025-02-10 19:00:00+00', '2025-02-10 22:00:00+00', 'Living Room');
```

## Running the Server

### Development

```bash
uvicorn app.main:app --reload
```

The server will start at http://localhost:8000 with hot-reload enabled.

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Commands

| Command | Description |
|---|---|
| `uvicorn app.main:app --reload` | Start the development server |
| `pytest tests/unit` | Run unit tests |
| `pytest tests/unit -v` | Run unit tests with verbose output |
| `pytest tests/unit --cov=app` | Run unit tests with coverage report |
| `pytest tests/integration` | Run integration tests (requires PostgreSQL) |
| `pytest tests/integration -v` | Run integration tests with verbose output |
| `pytest` | Run all tests |
| `make check` | Run unit tests and integration tests |
| `ruff check app/` | Check for lint errors |
| `ruff check --fix app/` | Auto-fix lint errors |
| `ruff format app/` | Format code |

## Linting & Formatting

This project uses [Ruff](https://docs.astral.sh/ruff/) for linting and formatting.

```bash
# Check for lint errors
ruff check app/

# Auto-fix lint errors
ruff check --fix app/

# Format code
ruff format app/
```

## API Documentation

Once the server is running, interactive API documentation is available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/health` | Health check |
| GET | `/api/events` | List all events |
| GET | `/api/events/{id}` | Get event by ID |
| POST | `/api/events` | Create a new event |
| PATCH | `/api/events/{id}` | Update an event |
| DELETE | `/api/events/{id}` | Delete an event |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/kino` |
| `DEBUG` | Enable debug mode | `false` |
