---
description: E2E testing rules and patterns (Playwright)
paths:
  - '**/*.spec.ts'
  - 'e2e/**'
---

# E2E Tests (Playwright)

## Setup

- File extension: **must** be `.spec.ts` (`.test.ts` not detected by `playwright.config.ts`)
- No path aliases (`$lib`, `$features` not resolved outside SvelteKit). Use type-only imports for types:

```typescript
// Bad: runtime import fails in E2E
import { TAB_SOLUTION } from '$features/workbooks/types/workbook';

// Good: type-only import + local constant
import type { WorkBookTab } from '$features/workbooks/types/workbook';

const TAB_SOLUTION: WorkBookTab = 'solution';
```

## Describe Hierarchy

Split large `describe` blocks by behavioral dimension, not flat `test()` calls:

```typescript
test.describe('logged-in user', () => {
  test.describe('tab visibility', () => { ... });
  test.describe('URL parameters', () => { ... });
  test.describe('navigation', () => { ... });
});
```

## Parameterized Tests

Playwright has no native `test.each`. Use `for...of` loops (official pattern):

**Single test with loop** — testing a sequence within one test:

```typescript
const GRADES = ['Q10', 'Q9', 'Q8'] as const;

for (const grade of GRADES) {
  await gradeButton(page, grade).click();
  await expect(page).toHaveURL(`?grades=${grade}`);
}
```

**Multiple tests from parameters** — independent cases:

```typescript
for (const grade of GRADES) {
  test(`filters by ${grade}`, async ({ page }) => {
    await page.goto('/tasks');
    await gradeButton(page, grade).click();
    await expect(page).toHaveURL(`?grades=${grade}`);
  });
}
```

## Selectors & Assertions

### Stable Selectors

Prefer in order:

1. Semantic: `getByRole('button', { name: /submit/i })`
2. Test IDs: `getByTestId('save-button')`
3. Avoid CSS classes (refactor-fragile) and internal text unless content is stable

### Assertion Best Practices

- After interaction (click tab, toggle), assert **new state** not just visibility
- Assert via accessibility attributes (`aria-pressed`, `aria-selected`, `data-*`), not CSS classes
- `toBeVisible()` may have been true before; assert the change instead:

  ```typescript
  // Bad: doesn't confirm interaction changed state
  await tab.click();
  await expect(content).toBeVisible();

  // Good: asserts content became visible
  await tab.click();
  await expect(page).toHaveURL('?tab=details');
  ```

## Setup & Teardown

- Use `test.beforeEach` / `test.afterEach` for per-test setup
- Use `test.describe.configure({ mode: 'parallel' })` for parallelization within a describe block
- Clean up auth state / fixtures after each test (`test.afterEach(() => { ... })`)

## Debugging

- `page.screenshot()` to capture state at assertion
- `page.pause()` for interactive debugging
- Logs: `page.on('console', msg => console.log(msg.text()))`

## Multi-Route Infrastructure Changes: Test Ordering

When implementing infrastructure changes that span multiple routes (e.g., redirect behavior, auth flow), write E2E tests **after** the core mechanism is implemented but **before** applying it to all routes:

1. **Implement core mechanism** (unit-tested) — e.g., `isSameOriginRedirect()`, `redirect()` logic
2. **Write E2E tests** (RED state) — tests fail until all routes are updated
3. **Apply to all routes** (GREEN state) — update each load/action function to use the mechanism

**Why this order?**

- If you write E2E tests before the mechanism exists, they'll fail immediately and block progress
- E2E tests verify integration end-to-end; unit tests verify the building blocks
- The RED→GREEN cycle for E2E tests spans multiple phases, unlike unit tests which turn GREEN immediately

**Example:** Redirect After Login pattern

- Phase 1-2: Unit test `isSameOriginRedirect()` (GREEN)
- Phase 3-4: Unit test auth helpers (GREEN)
- Phase 5-6: Implement login/signup actions (GREEN)
- Phase 7: Write E2E tests for all routes (RED)
- Phase 8-9: Update all load functions to pass `url` (GREEN)

## Testing Form Action Access Control

Use `page.evaluate(async (url) => fetch(url, { method: 'POST', ... }))` — not `page.request.post()` — to test form action security. In practice, `page.request.post()` fails to carry the session (cookies or `origin` header are not sent as expected), causing auth guards to redirect even for logged-in users.

SvelteKit's response format for form actions differs by outcome:

- `redirect()` → HTTP 200 + JSON body `{"type":"redirect","status":307,"location":"..."}`
- `error(N)` → HTTP status N

Parse the response body with a typed deserialize helper — not raw `JSON.parse`. `$app/forms` (`deserialize`) is not resolvable outside SvelteKit, so define a local `ActionResultLike` type and a `deserializeActionResult(text)` wrapper in the E2E helper (see `e2e/workbook_edit.spec.ts` for reference). Assert `type` and `location` from the deserialized result for redirect checks, and `response.status` for error checks.

## E2E Lessons from Votes Tests

Recent fixes (detailed in plan.md):

- Dropdown selectors drift when UI changes; re-verify on refactors
- Abort signal prevents stale response race; update signal if fetch signature changes
- Toast messages are temporary; use waiter pattern, not fixed delay

## Timeout: Element Not Found

When `page.locator()` or `getByRole()` times out:

1. Verify element exists in DevTools
2. Check ARIA roles in component UI libraries often lack semantic role definitions
3. If `role="menuitem"` fails: use href pattern or functional marker instead (e.g., `a[href^="/login?redirectTo"]` vs navbar's `/login`)
4. Never use `.first()` / `.last()` (DOM order is unstable)

**Example:** `getByRole('menuitem')` times out because DropdownItem renders as `<li><a>` without the role. Use `a[href^="/login?redirectTo"]` to distinguish dropdown from navbar.
