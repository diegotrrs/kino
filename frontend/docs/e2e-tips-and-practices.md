# E2E Testing Tips

Tips and patterns learned writing the Kino e2e suite with Playwright and Next.js App Router.

---

## 1. Idempotency

An idempotent test produces the same result no matter how many times it runs, in any order, against any state in the database.

### Use unique names for created resources

Append `Date.now()` to any name used to create a resource. This avoids conflicts with data left over from previous runs.

```ts
const name = `My Calendar ${Date.now()}`;
```

### Create test data via the API, not the UI

Use direct API calls to set up preconditions. This keeps tests fast and avoids cascading failures where a setup step breaks unrelated assertions.

```ts
const token = await getToken(request);
const uuid = await createCalendar(request, token, name);
await page.goto(`/calendars/${uuid}`);
```

### Clean up after every run

Use `afterAll` to reset state. Keep the test user account but delete everything it owns.

```ts
test.afterAll(async ({ request }) => {
  await resetTestData(request);
});
```

For resources that cannot be cleaned up by `resetTestData` (e.g. ephemeral users created mid-test), use `try/finally` so cleanup always runs even on failure.

```ts
const userId = await createTestUser(request, email, password, name);
try {
  // ... test body
} finally {
  await deleteUserById(request, userId);
}
```

### Never depend on test execution order

Each test must be self-contained. If a test needs a resource, it must create it — never assume a previous test already did. The one exception is sequential state within a single file (e.g. 5.4 votes, 5.5 removes), but even then prefer making each test independent.

---

## 2. Selectors

### Prefer role-based selectors

They are resilient to CSS and layout changes, and they reflect what a real user sees.

```ts
page.getByRole('button', { name: /save/i });
page.getByRole('link', { name: /calendars/i });
page.getByLabel('Email');
page.getByPlaceholder('email@example.com');
```

### Scope selectors to a container when strict mode fails

This solves two related problems.

**Problem 1 — strict mode:** if a selector matches more than one element (e.g. every row in a list has a Vote button), Playwright refuses to act on it. Scoping to a parent container first means only one match exists inside it.

**Problem 2 — live locator drift:** Playwright locators are lazy — they re-query the DOM on every evaluation. If you chain a locator off a role-based selector and the element's role or label changes after an interaction, the chain re-resolves to a _different_ element. Scoping to a stable container (like a row div) prevents this because the container itself never changes.

```ts
// Bad — after clicking vote, the button's aria-label changes to "Remove vote".
// .first() now resolves to the *next* unvoted item's button.
// The span inside it still shows the original count, so the assertion never passes.
const voteBtn = page.getByRole('button', { name: /vote/i }).first();
const count = voteBtn.locator('span');

// Good — the row div never changes, so count always points to the right span.
const row = page.locator('.divide-y > div').first();
const count = row.locator('span.tabular-nums');
```

### Scope to a list item when a page has many similar rows

```ts
page
  .getByRole('listitem')
  .filter({ hasText: name })
  .getByRole('button', { name: /restore/i });
```

### Scope to a parent row when a row has an Options/Delete button

The calendar list has multiple rows, each with its own Options button. `page.getByRole('button', { name: /options/i })` matches all of them — strict mode violation. Use the calendar name as an anchor: find its link, navigate up one level to the row with `locator('..')`, then find the Options button within that row only.

```ts
const row = page.getByRole('link', { name: calendarName }).locator('..');
await row.getByRole('button', { name: /options/i }).click();
```

`locator('..')` is a CSS parent selector — it moves one level up in the DOM.

### Use `.first()` only when both matches are equivalent

Toast text appears in two places at once: the visible toast `<div>` the user sees, and a hidden `<span role="status" aria-live="assertive">` that screen readers use to announce it. Both contain identical text, so `getByText(...)` matches both and strict mode fires. Because either one being present proves the toast was shown, `.first()` is safe here — both matches are equivalent evidence of the same thing.

```ts
await expect(page.getByText('Feedback sent. Thank you!').first()).toBeVisible();
```

This is different from the vote button case, where `.first()` was dangerous because the two matches were different wishlist items with different counts — picking the wrong one gave a wrong assertion.

---

## 3. Waiting and timing

### Prefer `waitForURL` over `expect(page).toHaveURL` after navigation

`waitForURL` uses the navigation timeout (30s by default). `expect(page).toHaveURL` uses the assertion timeout (5s by default). Under concurrent worker load, all workers trigger login server actions at the same time. The Next.js dev server processes them one at a time, so the last one in the queue can take longer than 5s to redirect. `waitForURL` gives it the full navigation budget.

```ts
// Fragile under load — times out after 5s
await expect(page).toHaveURL('/home');

// Robust — waits up to 30s
await page.waitForURL('/home');
```

### Wait for `networkidle` before reading dynamic values

In Next.js App Router, the server renders an initial HTML snapshot and sends it to the browser. React then hydrates the page and may fetch additional data on the client. If you read a value like a vote count immediately after `page.goto()`, you may get the stale SSR value before hydration and client fetches have completed. `networkidle` waits until there are no in-flight network requests for 500ms, at which point hydration and data fetching are done.

```ts
await page.goto('/feedback');
await page.waitForLoadState('networkidle');
const count = Number(await countSpan.textContent());
```

### Wait for a state change before asserting a derived value

After an interaction, wait for the element that confirms the action completed before asserting downstream effects.

```ts
await voteBtn.click();
await removeBtn.waitFor(); // confirms server action completed and aria-label updated
await expect(countSpan).toHaveText(String(initialCount + 1));
```

---

## 4. Strict mode violations

Playwright strict mode requires every locator to resolve to exactly one element. Common causes:

| Cause                                                                           | Fix                                                                |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Toast text appears in both the visible toast and the hidden aria-live announcer | Use `.first()`                                                     |
| Multiple list rows with the same button label                                   | Scope to the row container                                         |
| A heading and a paragraph both contain the same word                            | Use `getByRole('heading', { name })` instead of `getByText`        |
| A live locator shifts after an aria-label changes                               | Scope both the trigger and the assertion target to a stable parent |

---

## 5. Next.js App Router specifics

### `useActionState` form redirects can be slow under concurrent load

Server actions go through Next.js's internal fetch mechanism. The dev server processes them one at a time. When multiple workers all click a login button simultaneously at test startup, the requests queue up and the last one can take long enough to exceed a short timeout. Reduce workers locally to avoid the pile-up.

```ts
// playwright.config.ts
workers: process.env.CI ? undefined : 2,
```

### `useOptimistic` updates are client-side only

Optimistic state is applied immediately in the browser but reverts if the server action fails. If a test asserts the updated count and the server action errors, the assertion will see the reverted value. Ensure the test user has the necessary permissions and the action can succeed.

### `revalidatePath` does not update the current page automatically

After a server action calls `revalidatePath`, the cache is invalidated but the current page does not re-render. Call `page.reload()` to see updated server data.

```ts
await page.getByRole('button', { name: /invite/i }).click();
await expect(toastText.first()).toBeVisible();
await page.reload();
await expect(page.getByText(memberEmail)).toBeVisible();
```

### `useSearchParams` requires a Suspense boundary

`useSearchParams()` reads from the URL query string, which is only available in the browser — not during server-side rendering. Next.js requires any component that calls it to be wrapped in a `<Suspense>` boundary so React knows to defer rendering that part until the client takes over. Without it, hydration can fail and leave the page blank or stuck. In tests this surfaces as selectors finding nothing and the test timing out waiting for elements that never appear.

---

## 6. Test user management

### Use a persistent test user for most tests

Create a single `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` user. Use `globalSetup` to create it if it does not exist. After each spec, call `resetTestData` to delete owned resources but keep the account.

### Create ephemeral users only when testing multi-user flows

For tests that require a second user (invite, remove member), sign up a temporary user and delete them in `finally`.

```ts
const userId = await createTestUser(
  request,
  `e2e+${Date.now()}@kino.com`,
  'password',
  'Name'
);
try {
  // test body
} finally {
  await deleteUserById(request, userId);
}
```

### Keep test-only backend endpoints secret

Guard them with a shared secret header (`X-Test-Secret`) and disable them when the secret env var is not set.
