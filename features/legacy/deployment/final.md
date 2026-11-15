# Kino — Deployment Guide

**Stack:** Vercel (frontend) · DigitalOcean App Platform (backend) · Supabase (database)
**CI/CD:** GitHub Actions on push to `main`

---

## Architecture

```
Browser
  │
  ├── frontend.vercel.app  (Next.js — Vercel)
  │       │
  │       └── API calls to api.yourdomain.com
  │                  │
  │           DO App Platform  (FastAPI — Docker)
  │                  │
  │           Supabase :6543  (PostgreSQL via PgBouncer)
  │
  └── api.yourdomain.com  (optional custom domain on DO)
```

**How they communicate:**
- Frontend calls backend via `API_BASE_URL` (set as an env var in Vercel). Next.js server components call this server-to-server; browser calls go through the same URL.
- Backend connects to Supabase via `DATABASE_URL` (set as env var in DO App Platform). Always use port **6543** (PgBouncer), not 5432 (direct Postgres).
- No `.env` files in production — all secrets live in Vercel's and DO's environment variable dashboards.

---

## 1. Supabase — Database Setup

### 1a. Create a project

1. Go to https://supabase.com and sign in
2. **New project** → choose a name (`kino`) and a strong database password → select a region close to your DO region
3. Wait ~2 minutes for the project to provision

### 1b. Run migrations

Once the project is live, open **SQL Editor** and run your migration files in order:

```sql
-- paste the contents of each file in backend/migrations/ one at a time
```

Or use `psql` with the direct connection string (port 5432) — only for migrations, not the app:

```bash
psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" \
  -f backend/migrations/001_initial.sql
```

### 1c. Get the connection string

In your Supabase project: **Project Settings → Database → Connection string**

You need **two** strings:

| Purpose | Port | Use for |
|---|---|---|
| Direct connection | 5432 | Migrations only |
| Transaction pooler (PgBouncer) | 6543 | The FastAPI app |

The pooler string looks like:
```
postgresql://postgres.<project-ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

Copy the **6543 pooler string** — this is your `DATABASE_URL` for the app.

### 1d. Free tier caveat

Supabase Free pauses projects after **1 week of inactivity**. The first request after a pause takes ~30 seconds. This is fine during development; upgrade to Pro ($25/month) when you go live with real users.

---

## 2. Code Changes — Backend

### 2a. Connection pool in `database.py`

Replace the single-connection approach with a `ThreadedConnectionPool`. This keeps a small number of reusable connections open rather than opening a new one per request.

```python
# backend/app/database.py
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

`maxconn=10` is safe against Supabase's free tier limits and leaves room for migrations and your own `psql` sessions. You have one DO App Platform container, so this is the only pool — 10 connections total.

### 2b. Health check endpoint

DO App Platform needs a health check URL to know the container is running. Add this to `backend/app/main.py` if it doesn't exist:

```python
@app.get("/health")
def health():
    return {"status": "ok"}
```

### 2c. CORS

The frontend (Vercel) is on a different domain, so FastAPI needs to allow cross-origin requests. Update `backend/app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",   # your Vercel production URL
        "https://*.vercel.app",           # preview deployments
        "http://localhost:3000",          # local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Replace `your-app.vercel.app` with your actual Vercel URL (visible after first deploy). If you add a custom domain later, add it here too.

### 2d. Dockerfile

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

Test locally before pushing:

```bash
cd backend/
docker build -t kino-backend .
docker run -p 8000:8000 --env-file .env kino-backend
# visit http://localhost:8000/health
```

Your `.env` for local testing (never commit this):

```bash
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET_KEY=dev-secret-change-me
RESEND_API_KEY=re_xxxx
APP_BASE_URL=http://localhost:3000
```

---

## 3. DigitalOcean App Platform — Backend

### 3a. Create the app

1. Go to https://cloud.digitalocean.com/apps → **Create App**
2. **Source:** GitHub → select your `kino` repo → branch `main` → **Autodeploy** ON
3. **Source directory:** `backend`
4. DO detects the `Dockerfile` automatically
5. **Resource type:** Web Service
6. **Plan:** Basic ($5/month, 512 MB RAM, 1 vCPU) — enough for Kino at this stage
7. **HTTP port:** 8000
8. **Health check path:** `/health`

### 3b. Environment variables

In the App Platform editor, go to **Environment Variables** and add:

| Key | Value | Encrypted |
|---|---|---|
| `DATABASE_URL` | the 6543 pooler string from Supabase | Yes |
| `JWT_SECRET_KEY` | a long random string | Yes |
| `RESEND_API_KEY` | your Resend key | Yes |
| `RESEND_FROM_EMAIL` | your verified sender email | No |
| `APP_BASE_URL` | `https://your-app.vercel.app` | No |
| `ENV` | `production` | No |

Generate a strong JWT secret:
```bash
openssl rand -hex 32
```

### 3c. Custom domain (optional)

In your app: **Settings → Domains → Add Domain** → enter `api.yourdomain.com`

DO gives you a CNAME target. Add it at your domain registrar:
```
CNAME  api  <your-app>.ondigitalocean.app
```

TLS is provisioned automatically.

### 3d. Get the app ID for GitHub Actions

After creating the app, find your app ID in the URL:
```
https://cloud.digitalocean.com/apps/<APP_ID>/overview
```

You'll need this for the deployment workflow.

---

## 4. Vercel — Frontend

### 4a. Connect the repo

1. Go to https://vercel.com → **Add New → Project**
2. Import your `kino` GitHub repository
3. **Root Directory:** `frontend`
4. Framework preset auto-detects Next.js
5. Click **Deploy**

Vercel deploys automatically on every push to `main` from this point.

### 4b. Environment variables

In **Vercel → Project → Settings → Environment Variables**:

| Key | Value | Environment |
|---|---|---|
| `API_BASE_URL` | `https://api.yourdomain.com` | Production |
| `API_BASE_URL` | `https://<your-app>.ondigitalocean.app` | Preview |
| `API_BASE_URL` | `http://localhost:8000` | Development |

`API_BASE_URL` is what your Next.js app uses to call the backend (defined in `next.config.ts` already).

### 4c. Custom domain (optional)

**Settings → Domains → Add** → `yourdomain.com` or `app.yourdomain.com`

Vercel gives you a CNAME to add at your registrar. TLS is automatic.

---

## 5. GitHub Actions

### 5a. Frontend CI — `.github/workflows/ci-frontend.yml`

Runs lint, type check, and build on every push/PR touching the frontend. Vercel deploys automatically after this passes.

```yaml
name: Frontend CI

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/ci-frontend.yml'
  pull_request:
    paths:
      - 'frontend/**'

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
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - run: npm ci

      - run: npm run lint

      - run: npm run check

      - run: npm run test

      - run: npm run build
        env:
          API_BASE_URL: http://localhost:8000
```

### 5b. Backend CI + deploy — `.github/workflows/deploy-backend.yml`

Runs backend checks, then triggers a DO App Platform redeploy on push to `main`.

```yaml
name: Backend CI + Deploy

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'
  pull_request:
    paths:
      - 'backend/**'

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
          python-version: '3.12'
          cache: 'pip'

      - run: pip install -r requirements.txt -r requirements-dev.txt

      - run: make check

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

### 5c. Secrets to add in GitHub

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Where to get it |
|---|---|
| `DO_ACCESS_TOKEN` | DigitalOcean → API → Generate New Token (read+write) |
| `DO_APP_ID` | The app ID from your DO App Platform URL |

---

## 6. Environment Variables — Full Reference

### Backend (set in DO App Platform)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooler connection string (port 6543) |
| `JWT_SECRET_KEY` | Random 64-char hex string |
| `JWT_EXPIRATION_MINUTES` | `1440` (24 hours) |
| `RESEND_API_KEY` | From resend.com |
| `RESEND_FROM_EMAIL` | Your verified sender |
| `APP_BASE_URL` | `https://your-app.vercel.app` (used in email links) |
| `ENV` | `production` |

### Frontend (set in Vercel)

| Variable | Description |
|---|---|
| `API_BASE_URL` | `https://api.yourdomain.com` or the DO app URL |

### Local development (`.env` in `backend/`, never committed)

```bash
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET_KEY=any-dev-secret
RESEND_API_KEY=re_xxxx
RESEND_FROM_EMAIL=you@example.com
APP_BASE_URL=http://localhost:3000
ENV=development
```

Frontend local dev uses `.env.local` in `frontend/` (already gitignored by Next.js):
```bash
API_BASE_URL=http://localhost:8000
```

---

## 7. First Deploy — Step by Step

Do this once in order:

1. **Supabase:** create project, run migrations, copy the port-6543 pooler string
2. **Code changes:** apply the `database.py` pool changes, add `/health` endpoint, update CORS
3. **Dockerfile:** add `backend/Dockerfile`, test it locally
4. **DO App Platform:** create the app from GitHub, add all env vars, wait for first deploy to go green
5. **Verify backend:** `curl https://<your-app>.ondigitalocean.app/health` → `{"status":"ok"}`
6. **Vercel:** connect the repo, set `API_BASE_URL` to the DO app URL
7. **Verify frontend:** open the Vercel URL, log in, create a calendar
8. **CORS fix:** if you see CORS errors in the browser console, add the Vercel URL to the `allow_origins` list in FastAPI, push, wait for redeploy
9. **GitHub Actions secrets:** add `DO_ACCESS_TOKEN` and `DO_APP_ID`
10. **Verify CI/CD:** push a small change to `main`, confirm both workflows run green

---

## 8. Ongoing Workflow

After the first deploy, the day-to-day is:

```
git push origin main
  │
  ├── GitHub Actions: Frontend CI (lint + build)
  │       └── if green → Vercel auto-deploys
  │
  └── GitHub Actions: Backend CI + Deploy (make check → doctl redeploy)
          └── if green → DO App Platform pulls latest commit and rebuilds
```

Pull requests get a Vercel **preview deployment** automatically — a unique URL you can share to review changes before merging. Backend PRs only run CI (no deploy); the backend only deploys on merge to `main`.

---

## 9. Costs

| Service | Plan | Monthly |
|---|---|---|
| Vercel | Hobby (free) | $0 |
| DO App Platform | Basic (512 MB) | $5 |
| Supabase | Free | $0 |
| **Total** | | **$5/month** |

Upgrade triggers:
- **Vercel Pro ($20/month):** when you need team seats, advanced analytics, or remove the Vercel branding
- **Supabase Pro ($25/month):** when you go live with real users (eliminates the 1-week inactivity pause)
- **DO App Platform Professional ($12/month):** when you need more RAM or want zero-downtime deploys

At full production: ~$57/month.
