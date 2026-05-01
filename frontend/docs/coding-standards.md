# Frontend Coding Standards

## 1. Formatter & Linter

This project uses **ESLint** and **Prettier** (via Next.js defaults). Run before committing:

```bash
npm run lint
```

---

## 2. Naming Conventions

### 2.1 Variables and functions

- Use `camelCase` for variables, functions, and parameters
- Use descriptive action-verb prefixes to signal intent:
  - `get*` — retrieves or derives a value
  - `handle*` — event handlers (e.g. `handleSubmit`, `handleDelete`)
  - `build*` — constructs a data object from inputs
- Name booleans with `is`, `has`, or `can` prefixes (e.g. `isLoggedIn`, `canShare`)
- Avoid abbreviations unless universally understood (`id`, `url`, `uuid`)

### 2.2 Components and types

- Use `PascalCase` for React components, TypeScript interfaces, and type aliases
- Component filenames use `kebab-case`: `calendar-share-button.tsx`

### 2.3 Constants

- Use `UPPER_SNAKE_CASE` for module-level constants: `API_BASE_URL`, `MAX_LENGTH`

### 2.4 Always Use single quotes instead of double quotes

---

## 3. TypeScript

- Always annotate function parameters and return types
- Avoid `any` — use `unknown` and narrow explicitly
- Avoid non-null assertions (`!`) — use explicit narrowing instead
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use utility types (`Partial<T>`, `Pick<T, K>`, `Omit<T, K>`) over duplicating type definitions
- Use `as const` for constant lookup objects
- Prefer types over interfaces.

```ts
// Good
function getBackHref(from: string | undefined): string {
  return from === "home" ? "/home" : "/calendars";
}

// Bad
function getBackHref(from) {
  return from === "home" ? "/home" : "/calendars";
}
```

---

## 4. Functions

- Keep functions small and focused — one responsibility per function
- Prefer using const arrow function syntax (e.g., const fn = () => {}), over function declarations.
- Prefer `async`/`await` over `.then()` chains
- Use early returns to avoid deep nesting
- Always use curly braces for `if` blocks, even single-line
- Declare variables close to where they are used

---

## 5. React & Next.js

- **Server components by default** — only add `'use client'` when you need interactivity, browser APIs, or React hooks
- **Server actions** for all data mutations — no client-side `fetch` for writes
- **Default exports** for pages and layouts (required by Next.js)
- **Named exports** for all other components and utilities
- Keep components focused — split large components into smaller ones
- Co-locate server actions with the page they belong to (`app/(app)/calendars/actions.ts`)

---

## 6. Immutability

- Prefer `const` over `let` — use `let` only when reassignment is needed
- Treat arrays as immutable — prefer `map`, `filter`, `reduce`, and spread over `push`, `splice`, or direct index mutation

---

## 7. Styling

- Use **Tailwind CSS** utility classes — no custom CSS files unless absolutely necessary
- Use **shadcn/ui** components for all UI primitives (Button, Input, Dialog, etc.)
- Follow the existing class ordering pattern in the codebase

---

## 8. Comments

- Write code that doesn't need comments — if you need a comment to explain _what_ code does, consider renaming or extracting instead
- Reserve comments for non-obvious business rules or workarounds

---

## 9. Unit Tests

### 9.1 Test files

| File type          | Convention       |
| ------------------ | ---------------- |
| Test file          | `*.test.ts`      |
| Test data/builders | `*.test.data.ts` |

Isolate test data in `*.test.data.ts` files.

### 9.2 Test descriptions

- All `it()` descriptions must start with `should`
- Write the full sentence — avoid abbreviations
- The test name must be independently understandable — do not rely on the `describe` block
- Describe behaviour, not implementation

### 9.3 Describe blocks

- The outermost `describe` block identifies the unit under test — typically the function or component name
- Use nested `describe` blocks for grouping related scenarios

### 9.4 Pin time in date-dependent tests

Never rely on `Date.now()` or `new Date()` returning real wall-clock time in tests.

```ts
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});
```
