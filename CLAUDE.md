# 1. Project description

Kino is a web application for creating and managing calendars to organise trips and events. Users can create calendars, add events with dates and times, share calendars with other users, and collaborate. Public calendars can be viewed by unauthenticated users in read-only mode.

The project is split into two parts:

- **Frontend** — Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui. See `frontend/CLAUDE.md` for details.
- **Backend** — FastAPI, PostgreSQL (raw SQL via psycopg2), JWT authentication, Resend for emails. See `backend/CLAUDE.md` for details.

# 2. Coding Guidelines

See `frontend/docs/coding_standards.md` or `backend/docs/coding_standards.md`.

# 3. LLM (Claude) and person coding dynamic

When you are asked to start a feature, you will be provided with a feature file (all feature files are located in /features).

Example:

"Let's start the feature 9-4-share-calendar.md."

1. ALWAYS read `frontend/docs/coding_standards.md` or `backend/docs/coding_standards.md` BEFORE doing anything else
2. Read the feature file and ask any clarifying questions if needed
3. Once all questions are resolved, create a new \*.plan.md file (for example: 9-4-share-calendar.plan.md) containing the implementation plan

I may review and modify the plan. Once I confirm it is ready, you should use it as the definitive guide for implementation.
