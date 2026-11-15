# Kino — Step-by-Step Deployment Guide

**Stack:** Supabase (DB) → DigitalOcean App Platform (backend) → Vercel (frontend)
**Deploy branch:** `main`

Do the phases in order — each one depends on the previous.

---

## Phase 1 — Supabase (Database)

### Step 1.1 — Create a Supabase project

1. Go to https://supabase.com → sign in with GitHub
2. Click **New project**
3. Fill in:
   - **Name:** `kino`
   - **Database password:** generate a strong one and save it somewhere safe (you won't see it again)
   - **Region:** pick the one closest to where you'll host the backend (e.g. EU West for London)
4. Click **Create new project** and wait ~2 minutes for provisioning

### Step 1.2 — Run the schema

Once the project is ready, go to **SQL Editor** (left sidebar).

Click **New query**, paste the contents of `backend/init.sql`, and click **Run**.

### Step 1.3 — Run migrations in order

In the SQL Editor, run each file below as a separate query (new query for each):

1. `backend/migrations/add_start_date_to_calendars.sql`
2. `backend/migrations/add_is_public_to_calendars.sql`
3. `backend/migrations/add_locale_to_users.sql`
4. `backend/migrations/add_password_reset_tokens.sql`
5. `backend/migrations/add_feedback.sql`
6. `backend/migrations/add_event_links.sql`
7. `backend/migrations/add_event_costs.sql`
8. `backend/migrations/rename_event_costs_to_event_expenses.sql`
9. `backend/migrations/add_calendar_expenses.sql`

### Step 1.4 — Copy the connection strings

Go to **Project Settings → Database → Connection string**.

Copy these two and save them:

```
# Direct (port 5432) — for migrations and psql only
postgresql://postgres.<ref>:<password>@db.<ref>.supabase.co:5432/postgres

# Transaction pooler (port 6543) — for the app
postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

The app always uses the **6543** string. The 5432 string is only for running migrations manually via `psql`.

---

## Phase 2 — Backend Code Changes

Three changes needed before deploying. Make these on a branch, get them working locally, then merge to `main`.

### Step 2.1 — Add connection pooling to `database.py`

Replace the current contents of `backend/app/database.py`:

```python
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor

from .config import get_settings

_pool: ThreadedConnectionPool | None = None


def get_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            dsn=settings.database_url,
            cursor_factory=RealDictCursor,
        )
    return _pool


def get_db():
    pool = get_pool()
    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)
```

### Step 2.2 — Update CORS in `main.py`

The current CORS config only allows `localhost:3000`. Update it to also allow your Vercel URL.

Find the `CORSMiddleware` block in `backend/app/main.py` and replace it:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://<your-project>.vercel.app",  # replace with your actual Vercel URL
        "https://*.vercel.app",               # covers preview deployments
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

You won't know your Vercel URL until Phase 4 — come back and fill this in, then push again. For the first deploy you can leave `https://*.vercel.app` which covers all Vercel URLs.

### Step 2.3 — Add `Dockerfile`

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2.4 — Test locally with Docker

```bash
cd backend/

# Create a local .env file (never commit this)
cat > .env <<EOF
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
JWT_SECRET_KEY=any-local-secret
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=you@example.com
APP_BASE_URL=http://localhost:3000
ENV=development
EOF

docker build -t kino-backend .
docker run -p 8000:8000 --env-file .env kino-backend
```

Open http://localhost:8000/health — should return `{"status":"healthy"}`.

### Step 2.5 — Merge to `main`

```bash
git add backend/Dockerfile backend/app/database.py backend/app/main.py
git commit -m "Add Dockerfile and connection pool for production"
git push origin main
```

---

## Phase 3 — DigitalOcean App Platform (Backend)

### Step 3.1 — Create a DigitalOcean account

Go to https://cloud.digitalocean.com — sign up if you don't have an account.

### Step 3.2 — Create a new app

1. In the left sidebar: **Apps → Create App**
2. **Source:** choose **GitHub**
   - Authorize DigitalOcean to access your GitHub account if prompted
   - Select the `kino` repository
   - Branch: `main`
   - **Autodeploy:** ON (this deploys automatically on every push to `main`)
3. **Source directory:** set to `/backend`
4. DO will detect the `Dockerfile` — confirm it selected **Dockerfile** as the build type
5. Click **Next**

### Step 3.3 — Configure the resource

1. **Resource type:** Web Service (should be pre-selected)
2. **Plan:** Basic → **Basic ($5/month)** — 512 MB RAM, 1 vCPU
3. **HTTP port:** `8000`
4. Click **Next**

### Step 3.4 — Set environment variables

Click **Edit** next to Environment Variables and add each one:

| Key                      | Value                                             | Encrypt? |
| ------------------------ | ------------------------------------------------- | -------- |
| `DATABASE_URL`           | the port-6543 Supabase pooler string              | Yes      |
| `JWT_SECRET_KEY`         | run `openssl rand -hex 32` and paste the output   | Yes      |
| `JWT_EXPIRATION_MINUTES` | `1440`                                            | No       |
| `RESEND_API_KEY`         | your key from resend.com                          | Yes      |
| `RESEND_FROM_EMAIL`      | your verified sender email                        | No       |
| `APP_BASE_URL`           | leave blank for now — fill in after Vercel deploy | No       |
| `ENV`                    | `production`                                      | No       |

Click **Next → Create Resources**.

### Step 3.5 — Wait for first deploy

The first build takes 3–5 minutes. Watch the build log. If it goes green, your backend is live.

### Step 3.6 — Note your app URL

Once deployed, DO gives you a URL like:

```
https://kino-backend-xxxxx.ondigitalocean.app
```

Save this — you need it for Vercel.

### Step 3.7 — Verify

```bash
curl https://kino-backend-xxxxx.ondigitalocean.app/health
# Expected: {"status":"healthy"}
```

### Step 3.8 — Get your App ID (for GitHub Actions)

Look at the URL in your browser when viewing the app:

```
https://cloud.digitalocean.com/apps/<APP_ID>/overview
```

Copy the `APP_ID` — it's a UUID like `a1b2c3d4-...`. Save it for Step 5.

---

## Phase 4 — Vercel (Frontend)

### Step 4.1 — Create a Vercel account

Go to https://vercel.com → sign up with GitHub.

### Step 4.2 — Import the project

1. Click **Add New → Project**
2. Find the `kino` repository and click **Import**
3. Set **Root Directory** to `frontend`
4. Vercel detects Next.js automatically — leave all build settings as-is
5. **Don't deploy yet** — set the env var first

### Step 4.3 — Set environment variables

Before clicking Deploy, expand **Environment Variables** and add:

| Key            | Value                                           |
| -------------- | ----------------------------------------------- |
| `API_BASE_URL` | `https://kino-backend-xxxxx.ondigitalocean.app` |

Use the DO URL from Step 3.6.

Click **Deploy**.

### Step 4.4 — Wait for first deploy

Takes 2–3 minutes. Once green, Vercel gives you a URL like:

```
https://kino-xxxxxxxxx.vercel.app
```

### Step 4.5 — Update CORS in the backend

Now that you have your Vercel URL, go back and update `backend/app/main.py` with the exact URL:

```python
allow_origins=[
    "https://kino-xxxxxxxxx.vercel.app",  # your actual URL
    "https://*.vercel.app",
    "http://localhost:3000",
],
```

Push to `main` — DO will redeploy automatically.

### Step 4.6 — Update `APP_BASE_URL` in DO

Go to your DO app → **Settings → App-Level Environment Variables** → update `APP_BASE_URL` to your Vercel URL. This is used in email links (password reset etc.).

### Step 4.7 — Smoke test

Open your Vercel URL in the browser, register an account, create a calendar. If it works end-to-end, all three services are connected.

---

## Phase 5 — GitHub Actions

### Step 5.1 — Create a DO API token

1. In DigitalOcean: **API → Tokens → Generate New Token**
2. Name: `github-actions`
3. Scopes: **Read + Write**
4. Copy the token — you only see it once

### Step 5.2 — Add secrets to GitHub

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

Add these two:

| Secret name       | Value                         |
| ----------------- | ----------------------------- |
| `DO_ACCESS_TOKEN` | the token from Step 5.1       |
| `DO_APP_ID`       | the App ID UUID from Step 3.8 |

### Step 5.3 — Frontend CI workflow

Create `.github/workflows/ci-frontend.yml`:

```yaml
name: Frontend CI

on:
  push:
    branches: [main]
    paths:
      - "frontend/**"
      - ".github/workflows/ci-frontend.yml"
  pull_request:
    paths:
      - "frontend/**"

jobs:
  check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npm run test

      - name: Build
        run: npm run build
        env:
          API_BASE_URL: http://localhost:8000
```

Vercel deploys automatically when this passes and the push is to `main`. You don't need to trigger Vercel from GitHub Actions — it watches the repo itself.

### Step 5.4 — Backend CI + deploy workflow

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Backend CI + Deploy

on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - ".github/workflows/deploy-backend.yml"
  pull_request:
    paths:
      - "backend/**"

jobs:
  check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Lint
        run: ruff check .

      - name: Type check
        run: python -m mypy app/

      - name: Unit tests
        run: pytest tests/unit

  deploy:
    needs: check
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DO_ACCESS_TOKEN }}

      - name: Trigger App Platform redeploy
        run: doctl apps create-deployment ${{ secrets.DO_APP_ID }}
```

> **Note:** integration tests are not run in CI because they need a live database. They should be run locally before merging.

### Step 5.5 — Push and verify

```bash
git add .github/workflows/
git commit -m "Add GitHub Actions CI/CD workflows"
git push origin main
```

Go to your repo on GitHub → **Actions** tab. You should see both workflows triggered. The backend one will run checks and then call `doctl` to redeploy on DO.

---

## Phase 6 — Verify Everything

Run through this checklist after all phases are done:

- [ ] `curl https://kino-backend-xxxxx.ondigitalocean.app/health` returns `{"status":"healthy"}`
- [ ] Opening your Vercel URL loads the Kino home/login page
- [ ] Registering a new account works (email received if Resend is configured)
- [ ] Logging in works
- [ ] Creating a calendar works
- [ ] Creating an event works
- [ ] Push a small change to `main` → GitHub Actions runs → DO redeploys → Vercel redeploys

---

## Reference — Environment Variables

### Backend (set in DO App Platform)

| Variable                 | Example value                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`           | `postgresql://postgres.ref:pass@aws-0-eu-west-1.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET_KEY`         | output of `openssl rand -hex 32`                                                   |
| `JWT_EXPIRATION_MINUTES` | `1440`                                                                             |
| `RESEND_API_KEY`         | `re_xxxxxxxxxxxx`                                                                  |
| `RESEND_FROM_EMAIL`      | `hello@yourdomain.com`                                                             |
| `APP_BASE_URL`           | `https://kino-xxxxxxxxx.vercel.app`                                                |
| `ENV`                    | `production`                                                                       |

### Frontend (set in Vercel)

| Variable       | Example value                                   |
| -------------- | ----------------------------------------------- |
| `API_BASE_URL` | `https://kino-backend-xxxxx.ondigitalocean.app` |

### Local development (`backend/.env` — never commit)

```bash
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
JWT_SECRET_KEY=any-dev-secret
JWT_EXPIRATION_MINUTES=1440
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=you@example.com
APP_BASE_URL=http://localhost:3000
ENV=development
```
