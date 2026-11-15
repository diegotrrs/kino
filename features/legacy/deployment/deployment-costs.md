# Deployment Cost Summary

## Stack

| Layer | Provider |
|---|---|
| Frontend | Vercel |
| Backend | ECS + Fargate (FastAPI) |
| Database | RDS PostgreSQL |
| CI/CD | GitHub Actions |

---

## Architecture

```
Internet
    ↓
Vercel (Next.js)
    ↓ API calls
Application Load Balancer (public)
    ↓
ECS Fargate task (FastAPI) — public subnet
    ↓
RDS PostgreSQL — private subnet (not reachable from internet)
```

The Fargate task sits in a **public subnet** with a public IP. A security group restricts inbound traffic to the ALB only. RDS sits in a **private subnet** — only reachable from the Fargate security group. This avoids the need for a NAT Gateway (~$32/month), keeping costs down without sacrificing DB security.

---

## Monthly Cost Breakdown

### Early stage (solo developer, low traffic)

| Component | Details | Cost/month |
|---|---|---|
| Vercel | Hobby plan | $0 |
| ECS Fargate | 1 task, 0.25 vCPU, 0.5GB RAM | ~$9 |
| Application Load Balancer | Fixed + low LCU usage | ~$17 |
| RDS t3.micro | On-demand, 20GB storage, backups included | ~$15 |
| ECR | Container image storage (~1GB) | ~$1 |
| CloudWatch Logs | Log ingestion for backend | ~$1 |
| GitHub Actions | Within free tier (2,000 min/month) | $0 |
| **Total** | | **~$43/month** |

---

### Production (team, redundancy, always reliable)

| Component | Details | Cost/month |
|---|---|---|
| Vercel | Pro plan (multiple team members, better logs) | $20 |
| ECS Fargate | 2 tasks for redundancy (0.25 vCPU, 0.5GB each) | ~$18 |
| Application Load Balancer | Fixed + LCU usage | ~$17 |
| RDS t3.micro | On-demand, 20GB storage, backups included | ~$15 |
| ECR | Container image storage | ~$1 |
| CloudWatch Logs | Log ingestion | ~$2 |
| GitHub Actions | Within free tier | $0 |
| **Total** | | **~$73/month** |

---

### Production optimised (1-year RDS reserved instance)

Same as production above but commit to RDS for 1 year:

| Component | Cost/month |
|---|---|
| RDS t3.micro (reserved, all upfront ~$99/year) | ~$8 |
| Everything else | same as above |
| **Total** | **~$66/month** |

Saves ~$84/year vs on-demand RDS.

---

## GitHub Actions — why it's free

A typical CI/CD pipeline for Kino:

```
Push to main
  ├── Backend pipeline:  tests → build Docker image → push to ECR → deploy to ECS  (~5 min)
  └── Frontend pipeline: lint → type check → Vercel deploys automatically on push   (~3 min)
```

At 5 pushes/week:
```
40 runs/month × 5 min average = 200 minutes/month
Free tier: 2,000 minutes/month (private repo, free GitHub plan)
```

Well within the free tier. GitHub Actions costs nothing for this workload. Only if you add many parallel jobs or very long test suites would you approach the limit.

---

## The ALB is the biggest surprise

The Application Load Balancer (~$17/month) costs almost as much as the Fargate compute (~$9/month). This is unavoidable if you want:
- TLS termination (HTTPS)
- Health checks that restart unhealthy tasks
- Smooth zero-downtime deployments (ALB drains connections before stopping old tasks)

It is a fixed cost regardless of traffic — you pay it whether the app handles 10 requests or 10,000 per day.

---

## Summary

| Stage | Monthly cost | Notes |
|---|---|---|
| Early / solo | ~$43 | Vercel Hobby free, 1 Fargate task, RDS on-demand |
| Production | ~$73 | Vercel Pro, 2 Fargate tasks, RDS on-demand |
| Production optimised | ~$66 | Vercel Pro, 2 Fargate tasks, RDS reserved 1yr |

The ALB (~$17) and Vercel Pro (~$20) are the two largest line items. If cost is the primary concern at early stage, staying on Vercel Hobby ($0) and running a single Fargate task keeps the bill at ~$43/month — roughly the cost of a cheap VPS, but with auto-scaling, managed infrastructure, and no servers to maintain.
