---
description: E2E testing rules and patterns (Playwright)
paths:
  - '**/*.spec.ts'
  - 'e2e/**'
---

# E2E Tests (Playwright)

## No Path Aliases

The `e2e/` directory is outside SvelteKit's build pipeline — `$lib`, `$features`, and other path aliases are not resolved. Define string constant values as local constants with a reference comment:

```typescript
// Mirrors WorkBookTab.SOLUTION from $features/workbooks/types/workbook
const TAB_SOLUTION = 'solution';
```

Avoid importing values from `src/` in E2E test files. Type-only imports (`import type`) are acceptable since they are erased at compile time:

```typescript
// Bad: runtime import — path alias not resolved in e2e/
import { TAB_SOLUTION } from '$features/workbooks/types/workbook';

// Good: type-only import — compile-time only
import type { WorkBookTab } from '$features/workbooks/types/workbook';
const TAB_SOLUTION: WorkBookTab = 'solution';
```

## Describe Hierarchy

When a `describe` block for a user role grows large, split it by behavioral dimension rather than adding more flat `test()` calls:

```typescript
test.describe('logged-in user', () => {
  test.describe('tab visibility', () => { ... });
  test.describe('URL parameter handling', () => { ... });
  test.describe('navigation interactions', () => { ... });
  test.describe('session state', () => { ... });
});
```

## Parameterized Tests

Playwright has no native `test.each`. Use `for...of` loops — the official recommended pattern.

**Single test with a loop** — use when testing a sequence or workflow within one test:

```typescript
// Mirrors TaskGrade from $lib/types/task — do not import from src/ in E2E files
const GRADES = ['Q10', 'Q9', 'Q8'] as const;

for (const grade of GRADES) {
  await gradeButton(page, grade).click();
  await expect(page).toHaveURL(`?grades=${grade}`);
}
```

**Multiple tests from parameters** — use when each parameter represents an independent case:

```typescript
const GRADES = ['Q10', 'Q9', 'Q8'] as const;

for (const grade of GRADES) {
  test(`filters by grade ${grade}`, async ({ page }) => {
    await page.goto('/tasks');
    await gradeButton(page, grade).click();
    await expect(page).toHaveURL(`?grades=${grade}`);
  });
}
```

## Assertions

After an interaction that changes element state (active tab, toggle, selection), assert the _new_ state — not just that the element is visible, which may have been true before the interaction. Assert an active CSS class, `aria-selected`, or similar attribute instead of `toBeVisible()`.

### Prefer Semantic Attributes Over CSS Classes

Assert element state via accessibility attributes (`aria-pressed`, `aria-selected`, `data-*`), not CSS classes (which are implementation details and break on style refactors).

**Bad:** Brittle to styling changes

```typescript
await expect(button).toHaveClass(/text-primary-700/);
```

**Good:** Resilient to refactors

```typescript
await expect(button).toHaveAttribute('aria-pressed', 'true');
// or
await expect(button).toHaveAttribute('data-active', 'true');
```

**Note:** If component library doesn't expose the attribute, add it (or contribute PR). Teaching tests brittle selectors is not sustainable.

## Flowbite Toggle

Flowbite's `Toggle` renders an `sr-only` `<input type="checkbox">` inside a `<label>`. Clicking the input directly fails because the visual `<span>` sibling intercepts pointer events. Click the label wrapper instead:

```typescript
const toggleInput = page.locator('input[aria-label="<aria-label value>"]');
const toggleLabel = page.locator('label:has(input[aria-label="<aria-label value>"])');

await toggleLabel.click();
await expect(toggleInput).toBeChecked({ checked: true });
```

The same pattern applies to any Flowbite component that visually overlays its native input (e.g. `Checkbox`, `Radio`).

## Waiting for Svelte Transitions

Svelte's `{#if}/{:else}` blocks with transitions may temporarily render multiple elements with the same selector during outro/intro overlap. Playwright locators may match either element non-deterministically, causing flaky tests.

Use `waitForFunction` with `Array.from(elements).every(...)` to explicitly wait until **all** matching elements reach the desired state before asserting — checking every element guards against the transient window where multiple elements coexist. **Do not use assertions as implicit sleeps** — separating wait logic from assertions makes test intent clear and avoids timing-dependent failures.

This pattern applies to any Svelte component with transitions: modals, drawers, dropdowns, etc.

## Strict Mode: Scope Locators to the Content Area

When the navbar and page body both contain a link or button with the same text (e.g., a breadcrumb and a nav link share the same label), `getByRole` in strict mode will find multiple matches and throw. Scope the locator to the page's content container:

```typescript
// Bad: matches navbar link AND breadcrumb link
await page.getByRole('link', { name: 'グレード投票' }).click();

// Good: scoped to page content only
await page.locator('.container').locator('nav').getByRole('link', { name: 'グレード投票' }).click();
await page.locator('.container').getByRole('link', { name: 'ログイン' }).click();
```

Use `.container` (page content wrapper) to exclude the global navbar. Prefer the narrowest scope that remains stable — breadcrumb `nav` inside `.container` is more precise than `.container` alone when the link only appears there.

## Search-Gated Tables: Fill Before Locating Rows

When a table renders no rows until the search input is non-empty, fill the
search box before attempting to locate links or cells. Skipping the fill makes
`isVisible()` return `false` silently, causing navigation helpers to return
early instead of failing loudly.

```typescript
const KNOWN_TASK_ID = 'abc422_a'; // From prisma/tasks.ts seed data
await page.getByPlaceholder('問題名・問題ID・出典で検索').fill(KNOWN_TASK_ID);
const firstLink = page.locator('table').getByRole('link').first();
const hasTask = await firstLink.isVisible();
```

## Direct URL vs Navigation Flow in Detail Page Tests

Use a navigation helper (search + click) **only** when the transition itself is
under test. Use `page.goto(KNOWN_DETAIL_URL)` for all content/behavior tests on
the detail page — coupling them to the list page multiplies failure surfaces.

```typescript
const KNOWN_VOTE_DETAIL_URL = '/votes/abc422_a'; // From prisma/tasks.ts seed data

// Verifies list→detail flow
test('can view the task detail page without redirect', async ({ page }) => {
  await navigateToFirstVoteDetailPage(page);
  ...
});

// Content-only: go directly
test('sees login prompt', async ({ page }) => {
  await page.goto(KNOWN_VOTE_DETAIL_URL);
  ...
});
```

## Seed-Stable URL Constants

E2E constants derived from seed data must carry an inline comment citing the
source file. Without it, reviewers cannot distinguish an intentional seed
reference from a magic string.

```typescript
const KNOWN_TASK_ID = 'abc422_a';           // From prisma/tasks.ts seed data
const KNOWN_VOTE_DETAIL_URL = '/votes/abc422_a'; // From prisma/tasks.ts seed data
```

## Conditional Skip Based on Runtime State

When a test depends on DB or session state that may vary across environments (e.g., a user's AtCoder verification status), use `test.skip(condition, reason)` inside the test body instead of a static `test.skip`. This way the test runs automatically when the precondition is met:

```typescript
test('sees vote grade buttons', async ({ page }) => {
  await page.goto(url);

  const isUnverified = await page.getByText('AtCoderアカウントの認証が必要です').isVisible();
  test.skip(isUnverified, 'test user is not AtCoder-verified');

  // assertions below run only when precondition holds
  await expect(page.locator('form[action="?/voteAbsoluteGrade"]')).toBeVisible();
});
```

Prefer this over a hard-coded `test.skip` whenever the condition is observable on the page.
