# 1. UI Blocks

## 2. Pages

In conversations, when referring to the following pages:
• Calendar page: frontend/app/(app)/calendars/[id]/page.tsx
• My Calendars page: frontend/app/(app)/calendars/page.tsx
• Home page: frontend/app/(app)/home/page.tsx

## 3. Navigation Bars

• Left navigation bar: frontend/lib/nav.ts
• Top navigation bar: frontend/components/top-bar.tsx

# 2. User's auth status

The Calendar page is accessible without session.

# 3. Backend Coding Guidelines

- Do not use Alchemy or any other ORM.
- Passwords are encrypted using bcrypt.

# 4. Frontend Coding Guidelines

TBD

# 5. LLM (Claude) and person coding dynamic

When you are asked to start a feature, you will be provided with a feature file (all feature files are located in /features).

Example:

“Let’s start the feature 9-4-share-calendar.md.”

You should first read the file and ask any clarifying questions if needed. Once all questions are resolved, you will create a new \*.plan.md file (for example: 9-4-share-calendar.plan.md) containing the implementation plan.

I may review and modify the plan. Once I confirm it is ready, you should use it as the definitive guide for implementation.
