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

# 5. Internationalisation (i18n)

The project uses **next-intl** for translations.

**Supported locales:** `en`, `es`, `pt`, `de` — defined in `i18n/routing.ts`, with `en` as the default.

**Key files:**

| File                     | Purpose                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `i18n/routing.ts`        | Locale list and default locale                                             |
| `i18n/request.ts`        | Resolves locale from `locale` cookie per request, loads message file       |
| `lib/locale.ts`          | `detectLocale()` — parses `Accept-Language` header to pick the best locale |
| `messages/<locale>.json` | Translation strings for each locale (`en`, `es`, `pt`, `de`)               |

Translations must be considered for every feature.

**How to use translations:**

Server components — use `getTranslations` from `next-intl/server`:

```ts
import { getTranslations } from 'next-intl/server';

const t = await getTranslations('home');
```

Client components — use `useTranslations` from `next-intl`:

```ts
import { useTranslations } from 'next-intl';

const t = useTranslations('nav');
```

The string passed to `getTranslations` / `useTranslations` is the top-level namespace key in the `messages/<locale>.json` files.

# 6. Analytics (PostHog)

Analytics only runs where `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set (Vercel Production), and only after the visitor accepts the consent banner.

- **Every event is declared** in `lib/analytics/events.ts` (`AnalyticsEvents`) and sent with `track()`. New features add their events there.
- **Track after the action succeeds,** never before the server call.
- **Never put text a user wrote into an event:** no calendar or event names, addresses, booking references, emails or feedback. Use booleans, counts and fixed values instead (`has_address`, `travel_mode`).
- `lib/analytics/clean-url.ts` strips calendar UUIDs and query strings from every URL before sending.
- Analytics tests are in `e2e/19-analytics.spec.ts`. Most of them need a dummy token; see the note at the top of the file.

