# 1. Project description

Kino is a web application for creating and managing calendars to organise trips and events. Users can create calendars, add events, share calendars with other users, and collaborate in real time. The frontend is a Next.js 15 App Router application using TypeScript, Tailwind CSS, and shadcn/ui components. It communicates with the Kino FastAPI backend via server actions and server components.

# 2. File & Module Structure

```
frontend/
├── app/
│   ├── (app)/              # Authenticated app routes (layout with nav)
│   │   ├── calendars/      # My Calendars page + calendar detail + edit
│   │   ├── home/           # Home page
│   │   ├── feedback/       # Feedback & Wishlist page
│   │   └── settings/       # Settings + deleted calendars
│   ├── (marketing)/        # Unauthenticated routes (no nav)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   └── auth/
│       └── actions.ts      # Login, signup, logout, password reset server actions
├── components/
│   ├── calendars/          # Calendar-specific components (list, edit form, share, etc.)
│   ├── feedback/           # Feedback form and wishlist components
│   ├── ui/                 # shadcn/ui base components
│   ├── calendar.tsx        # FullCalendar wrapper
│   ├── top-bar.tsx         # Top navigation bar
│   ├── desktop-sidebar.tsx # Left navigation bar (desktop)
│   ├── mobile-bottom-nav.tsx # Bottom navigation (mobile)
│   └── app-shell.tsx       # Layout shell wrapping sidebar + top bar
├── context/
│   └── events-context.tsx  # React context for calendar events and UI state
├── lib/
│   ├── types.ts            # Shared TypeScript interfaces (Calendar, Event, etc.)
│   └── nav.ts              # Left navigation bar link definitions
└── utils/
    └── data.ts             # FullCalendar event type and seed data
```

# 3. Coding Standards

See [`docs/coding-standards.md`](docs/coding-standards.md) for naming conventions, component structure, TypeScript usage, styling, and more.

# 4. UI Blocks

## 4.1 Pages

In conversations, when referring to the following pages:

- Calendar page: `app/(app)/calendars/[uuid]/page.tsx`
- My Calendars page: `app/(app)/calendars/page.tsx`
- Home page: `app/(app)/home/page.tsx`
- Feedback page: `app/(app)/feedback/page.tsx`

## 4.2 Navigation Bars

- Left navigation bar: `lib/nav.ts`
- Top navigation bar: `components/top-bar.tsx`
