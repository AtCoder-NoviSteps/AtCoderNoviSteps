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

## Parametrized Tests

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

## E2E Lessons from Votes Tests

Recent fixes (detailed in plan.md):

- Dropdown selectors drift when UI changes; re-verify on refactors
- Abort signal prevents stale response race; update signal if fetch signature changes
- Toast messages are temporary; use waiter pattern, not fixed delay
