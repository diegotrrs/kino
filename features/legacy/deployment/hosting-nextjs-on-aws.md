# Hosting Next.js on AWS (Containerised)

## Why containerise instead of Vercel?

Vercel runs each SSR page render and API route as a serverless Lambda invocation. At low traffic this is cheap, but under sustained load (or with a generous free tier expiry) costs grow unpredictably. A containerised Next.js app runs as a plain Node.js HTTP server — no per-invocation billing, predictable resource usage, and the same Docker image you test locally is what runs in production.

Next.js supports this out of the box via `output: 'standalone'` in `next.config.ts`, which produces a self-contained Node server you can `COPY` straight into a Docker image.

---

## AWS Options

### 1. App Runner

A fully managed service: you give it a container image (from ECR) and it handles everything else — load balancing, TLS, auto-scaling, health checks.

**Pros**
- Simplest setup of any AWS option — no VPC, no task definitions, no clusters
- Scales to zero when idle (you pay nothing for a quiet app overnight)
- Built-in HTTPS with a `*.awsapprunner.com` domain out of the box
- Good fit for a single-service app like Kino's frontend

**Cons**
- Less control — you cannot configure the underlying infrastructure
- More expensive per vCPU/GB than running the same workload on ECS + Fargate
- Cold starts when scaling up from zero (a few seconds on first request after idle)
- No persistent connections to a private VPC by default (needs VPC connector add-on for RDS access)

**Good for:** side projects, early-stage apps, teams that want zero ops overhead.

---

### 2. ECS + Fargate

ECS (Elastic Container Service) is AWS's container orchestrator. Fargate is the "serverless" compute layer — AWS manages the underlying EC2, you just define CPU/memory per task.

**Pros**
- No EC2 instances to patch or manage
- Fine-grained control over networking (VPC, security groups, subnets)
- Integrates naturally with ALB (Application Load Balancer) for routing, health checks, and TLS termination
- Scales horizontally with auto-scaling policies
- Pairs well with ECR, Secrets Manager, CloudWatch Logs

**Cons**
- More moving parts than App Runner (cluster, service, task definition, ALB, target group)
- Does not scale to zero — minimum 1 running task means you always pay for at least one container
- Initial setup takes longer; steeper learning curve

**Good for:** production apps that need reliable always-on behaviour, VPC-private database access, or more infrastructure control.

---

### 3. ECS + EC2 Launch Type

Instead of Fargate, you manage a pool of EC2 instances that run your containers.

**Pros**
- Cheaper than Fargate for sustained, predictable workloads (you own the instance)
- Full control over instance type, OS, and storage
- Reserved Instances / Savings Plans can cut costs significantly

**Cons**
- You are responsible for patching, scaling, and replacing EC2 instances
- More operational overhead than Fargate for little gain at small scale
- Bin-packing containers onto instances adds complexity

**Good for:** high-traffic apps where Fargate costs are significant and you want to optimise.

---

### 4. Lightsail Containers

AWS Lightsail is a simplified VPS product. Its container service hides most of the AWS complexity behind fixed monthly pricing.

**Pros**
- Predictable flat monthly cost (e.g. $7–$25/month for small nodes)
- Simple deployment UI — push image, set env vars, deploy
- Built-in load balancer and HTTPS included

**Cons**
- Very limited scaling — no auto-scaling, manual node size upgrades
- Weaker integration with the rest of AWS (IAM, VPC, CloudWatch)
- Not suitable if the app grows beyond a couple of containers

**Good for:** hobby projects or MVPs where you want a known monthly bill and minimal configuration.

---

### 5. EC2 (Docker directly)

Run Docker Compose (or plain Docker) on a single EC2 instance.

**Pros**
- Familiar — same as running locally
- Cheapest option for a small always-on app (a `t3.small` is ~$15/month)
- Full control over everything

**Cons**
- No auto-scaling, no self-healing if the container crashes (unless you add something like systemd or ECS agent)
- You manage OS updates, disk, security groups, and Docker upgrades yourself
- Not production-grade without extra tooling (Nginx reverse proxy, Certbot for TLS, etc.)

**Good for:** learning, very low-traffic internal tools, or when cost is the only constraint.

---

## Recommendation for Kino

| Stage | Option | Reason |
|---|---|---|
| Development / MVP | **App Runner** | Zero ops, scales to zero, fast to set up |
| Production (growth) | **ECS + Fargate** | Always-on, VPC-private DB access, more control |
| Cost optimisation later | **ECS + EC2** | Commit to Reserved Instances once traffic is predictable |

A practical path: start on App Runner, migrate to ECS + Fargate when you need private networking or the cost difference becomes meaningful.

---

## Key Next.js config for containers

```ts
// next.config.ts
const nextConfig = {
  output: 'standalone', // produces a self-contained Node server in .next/standalone
};
```

With `standalone` output your Dockerfile becomes straightforward:

```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```
