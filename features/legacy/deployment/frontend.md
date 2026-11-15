# Deployment — Frontend (Vercel)

## Overview

Vercel is the simplest part of the deployment. Unlike the backend and database, it requires no Terraform — Vercel manages its own infrastructure. You connect your GitHub repository, set environment variables, and Vercel handles the rest.

This guide covers:
- Connecting the repo to Vercel
- Configuring environment variables (including the backend API URL)
- Custom domain setup
- GitHub Actions pipeline for pre-deployment checks
- Preview deployments per pull request

Prerequisites: complete `backend.md` first — you need the backend API URL (ALB domain) before configuring Vercel environment variables.

---

## 1. Install Vercel CLI

```bash
npm install -g vercel

# Verify
vercel --version
```

---

## 2. Connect the repo to Vercel

### Option A — Vercel dashboard (recommended first time)

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project**
3. Import the `kino` repository
4. Set the **Root Directory** to `frontend`
5. Framework preset will auto-detect **Next.js**
6. Click **Deploy**

Vercel will deploy on every push to `main` automatically from this point.

### Option B — Vercel CLI

```bash
cd frontend/
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set root directory to frontend/
# - Accept detected Next.js settings
```

---

## 3. Environment variables

The Next.js frontend needs to know where the backend API is. Set this in Vercel's dashboard:

**Vercel dashboard → Your project → Settings → Environment Variables**

| Variable | Value | Environment |
|---|---|---|
| `API_BASE_URL` | `https://api.yourdomain.com` | Production |
| `API_BASE_URL` | `https://api.yourdomain.com` | Preview |
| `API_BASE_URL` | `http://localhost:8000` | Development |

`API_BASE_URL` is the ALB domain from the backend setup — either the `alb_dns_name` Terraform output (e.g. `kino-alb-xxxx.eu-west-1.elb.amazonaws.com`) or your custom domain if you set one up (e.g. `api.yourdomain.com`).

### Setting via CLI

```bash
# Production
vercel env add API_BASE_URL production
# Enter value when prompted: https://api.yourdomain.com

# Preview
vercel env add API_BASE_URL preview
```

---

## 4. Custom domain

If you have a domain (e.g. `yourdomain.com`) and want the frontend at `app.yourdomain.com`:

1. Vercel dashboard → Your project → **Settings → Domains**
2. Add `app.yourdomain.com`
3. Vercel shows you a CNAME record to add to your DNS:
   ```
   CNAME  app  cname.vercel-dns.com
   ```
4. Add it at your domain registrar
5. Vercel automatically provisions a TLS certificate via Let's Encrypt

---

## 5. next.config.ts — standalone output

For local Docker builds (if you ever containerise the frontend later) add `output: 'standalone'`. For Vercel this is **not needed** — Vercel handles the build itself. Leave your `next.config.ts` as-is for now.

---

## 6. GitHub Actions pipeline

Vercel deploys automatically on every push to `main`, but you should add a pre-deployment check pipeline that runs lint, type checking, and tests before Vercel picks up the change.

Create `.github/workflows/ci-frontend.yml`:

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
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run check

      - name: Unit tests
        run: npm run test

      - name: Build
        run: npm run build
        env:
          # Dummy value so the build does not fail without the real backend
          API_BASE_URL: http://localhost:8000
```

This runs on every push and pull request that touches the `frontend/` directory. If any step fails, the pipeline stops — you will see the failure in GitHub before Vercel even starts its deployment.

---

## 7. Preview deployments

Vercel automatically creates a unique preview URL for every pull request:

```
PR #42 → https://kino-git-feature-my-new-feature-yourname.vercel.app
```

This is one of Vercel's best features — you can share the URL with anyone to review changes before merging, without affecting production.

Preview deployments use the **Preview** environment variables you set in step 3. By default they point at the same backend as production, which is fine for most testing. If you want a separate staging backend, set a different `API_BASE_URL` for the Preview environment.

---

## 8. Check deployment logs

```bash
# List recent deployments
vercel ls

# View logs for a specific deployment
vercel logs <deployment-url>

# View logs for production
vercel logs --prod
```

Or view them in the Vercel dashboard under **Deployments → select a deployment → View logs**.

---

## 9. Rollback

If a deployment causes problems, rolling back is instant in Vercel:

**Vercel dashboard → Deployments → find a previous deployment → ··· → Promote to Production**

Or via CLI:

```bash
# List deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

---

## 10. Connecting the pieces — checklist

Before your first production deployment, verify:

- [ ] `API_BASE_URL` env var is set to the backend ALB URL or custom domain
- [ ] The backend `/health` endpoint returns 200 (ALB health check passing)
- [ ] CORS is configured in FastAPI to allow requests from your Vercel domain:

```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.yourdomain.com",        # production
        "https://*.vercel.app",               # preview deployments
        "http://localhost:3000",              # local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] The backend is reachable at `https://api.yourdomain.com/health` from your browser
- [ ] The frontend build succeeds (`npm run build`) with the production `API_BASE_URL`
