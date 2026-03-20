---
description: Testing rules and patterns
paths:
  - '**/*.test.ts'
  - '**/*.spec.ts'
  - 'e2e/**'
  - 'src/test/**'
---

# Testing

## Test Titles

Write all test titles in English. Use descriptive sentences that state the expected behavior (e.g., `'returns empty array when workbooks is empty'`). Japanese is only acceptable in inline comments or fixture strings that represent real user-facing content.

## Test Integrity

- Never delete, comment out, or weaken assertions (e.g. `toEqual` → `toBeDefined`) to make tests pass
- Fix the implementation, not the test; if the test itself is wrong, explain why in a comment or commit message

## Test Types

| Type | Tool       | Location                                                          | Run Command      |
| ---- | ---------- | ----------------------------------------------------------------- | ---------------- |
| Unit | Vitest     | `src/test/` (mirrors `src/lib/`) or co-located in `src/features/` | `pnpm test:unit` |
| E2E  | Playwright | `e2e/`                                                            | `pnpm test:e2e`  |

E2E test files must use the `.spec.ts` extension. `playwright.config.ts` matches only `*.spec.ts`, so `.test.ts` files will not be detected.

## Assertions

- Use `toBe(true)` / `toBe(false)` over `toBeTruthy()` / `toBeFalsy()`
- For DB query tests, assert `orderBy`, `include`, and other significant parameters with `expect.objectContaining` — not just `where`
- Enum membership: `in` traverses the prototype chain; use `Object.hasOwn(Enum, value)` instead
- **E2E state transitions**: after an interaction that changes element state (active tab, toggle, selection), assert the _new_ state — not just that the element is visible, which may have been true before the interaction. Assert an active CSS class, `aria-selected`, or similar attribute instead of `toBeVisible()`

## Cleanup in Tests

Wrap DB-mutating cleanup in `try/finally` — a failing assertion skips cleanup and contaminates later tests:

```typescript
try {
  await doSomething();
  expect(result).toBe(expected);
} finally {
  await restoreState();
}
```

## Test Data

- Use realistic fixture values (real task IDs, grade names) instead of placeholders like `'t1'`
- Extract shared data into fixture files; inline is fine for single-use cases
- After `.filter()` on fixtures, verify actual contents — same ID may refer to a different entity after fixture updates
- **Description ↔ code path alignment**: when a test name describes a specific scenario (e.g. "tie-break"), verify the fixture actually exercises that code path. A test that passes without reaching the branch it claims to cover gives false confidence

## Mock Helpers

Extract repeated mock patterns into helpers in the test file. For Prisma service tests, define the return type alias once and use it across all helpers:

```typescript
type PrismaWorkBook = Awaited<ReturnType<typeof prisma.workBook.findUnique>>;
type PrismaWorkBookRow = Awaited<ReturnType<typeof prisma.workBook.findMany>>[number];

function mockFindUnique(value: PrismaWorkBook) {
  vi.mocked(prisma.workBook.findUnique).mockResolvedValue(value);
}

function mockFindMany(value: PrismaWorkBookRow[]) {
  vi.mocked(prisma.workBook.findMany).mockResolvedValue(
    value as unknown as Awaited<ReturnType<typeof prisma.workBook.findMany>>,
  );
}

function mockCount(value: number) {
  vi.mocked(prisma.workBook.count).mockResolvedValue(value);
}
```

Extract `mockFindUnique`, `mockFindMany`, and `mockCount` as the standard trio for service tests that touch a single Prisma model. Add `mockCreate`, `mockTransaction`, and `mockDelete` when those operations are also tested.

## Component Vitest Unit Tests

Omit Vitest unit tests for a Svelte component when **both** conditions hold:

1. The component is template-only (no logic beyond prop bindings and basic conditionals)
2. The component is covered by E2E tests

When a component contains extracted logic (e.g. derived values, event handlers, utility calls), add unit tests for that logic in the nearest `utils/` file instead of testing the component directly.

## Testing Extracted Utilities

- Add tests at extraction time, not later
- For URL manipulation: assert the original URL is not mutated
- For multi-column operations (e.g., DnD): assert both source and destination columns

## Coverage

- Run `pnpm coverage` for coverage report
- Target: 80% lines, 70% branches

## Service Layer Split for Testability

When a service file mixes DB operations and pure functions, split it into two files:

- `crud.ts` — DB operations (`getXxx`, `updateXxx`, `createXxx`); tests need Prisma mocks
- `initializers.ts` — pure computation (grade grouping, priority assignment); tests need no mocks

Stop the split if internal helpers (e.g. `fetchUnplacedWorkbooks`) would be fragmented across files — cohesion matters more than the split itself.

## HTTP Mocking

Use Nock for external HTTP calls. See `src/test/lib/clients/` for examples.

## Flowbite Toggle in E2E Tests

Flowbite's `Toggle` renders an `sr-only` `<input type="checkbox">` inside a `<label>`. Clicking the input directly fails because the visual `<span>` sibling intercepts pointer events. Click the label wrapper instead:

```typescript
const toggleInput = page.locator('input[aria-label="<aria-label value>"]');
const toggleLabel = page.locator('label:has(input[aria-label="<aria-label value>"])');

await toggleLabel.click();
await expect(toggleInput).toBeChecked({ checked: true });
```

The same pattern applies to any Flowbite component that visually overlays its native input (e.g. `Checkbox`, `Radio`).
