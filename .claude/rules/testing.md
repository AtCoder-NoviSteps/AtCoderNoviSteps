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

## Tests Ship with the Implementation

Tests must be included in the same commit as the implementation they cover. "Add tests later" is not acceptable — a feature or fix is not done until its tests pass.

If a task description does not mention tests, add them anyway for any non-trivial logic.

## Test Integrity

- Never delete, comment out, or weaken assertions (e.g. `toEqual` → `toBeDefined`) to make tests pass
- Fix the implementation, not the test; if the test itself is wrong, explain why in a comment or commit message

## Unused Imports in Test Files

An unused import in a test file is a signal that a test was planned but not yet written — not dead code to remove.

Before deleting such an import, check whether the corresponding test case is missing and add it:

```typescript
// Bad: remove the import because it's unused
import { ABCLikeProvider } from './contest_table_provider';

// Good: the import is unused because the test is missing — add the test
test('expects to create ABCLike preset correctly', () => {
  const group = prepareContestProviderPresets().ABCLike();
  expect(group.getProvider(ContestType.ABC_LIKE)).toBeInstanceOf(ABCLikeProvider);
});
```

Removing the import silences the linter but leaves a coverage gap. Adding the test both satisfies the linter and improves coverage.

## Test Types

| Type | Tool       | Location                                                          | Run Command      |
| ---- | ---------- | ----------------------------------------------------------------- | ---------------- |
| Unit | Vitest     | `src/test/` (mirrors `src/lib/`) or co-located in `src/features/` | `pnpm test:unit` |
| E2E  | Playwright | `e2e/`                                                            | `pnpm test:e2e`  |

E2E test files must use the `.spec.ts` extension. `playwright.config.ts` matches only `*.spec.ts`, so `.test.ts` files will not be detected.

## Assertions

- Use `toBe(true)` / `toBe(false)` over `toBeTruthy()` / `toBeFalsy()`
- For DB query tests, assert `orderBy`, `include`, and other significant parameters with `expect.objectContaining` — not just `where`. When a returned field (e.g. `authorName`) depends on an `include` relation, that `include` clause must be part of the assertion, or a regression in the query shape will go undetected
- Enum membership: `in` traverses the prototype chain; use `Object.hasOwn(Enum, value)` instead

## Test Stubs

Test stub parameter types must match the production function's signature — use domain types (e.g. `TaskGrade`), not `string`; a mismatch compiles silently but lets the stub accept inputs the real function would reject.

## Test Data

- Use realistic fixture values (real task IDs, grade names) instead of placeholders like `'t1'`
- Extract shared data into fixture files; inline is fine for single-use cases
- After `.filter()` on fixtures, verify actual contents — same ID may refer to a different entity after fixture updates
- **Description ↔ code path alignment**: when a test name describes a specific scenario (e.g. "tie-break"), verify the fixture actually exercises that code path. A test that passes without reaching the branch it claims to cover gives false confidence

## Coverage

- Run `pnpm coverage` for coverage report
- Target: 80% lines, 80% branches

## Test Order Mirrors Source Order

Order `describe` blocks in service and utils test files to match the declaration order of functions in the source file. Misalignment makes it harder to cross-reference tests and implementation.

## Service Layer Unit Tests

Service tests mock Prisma via `vi.mock('$lib/server/database', ...)` — no real DB mutations occur.

### Mock Helpers

Extract repeated mock patterns into helpers in the test file. Define the return type alias once and use it across all helpers:

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

### Cleanup for Integration Tests and Tests with Real Side Effects

This does not apply to standard service layer unit tests that use Prisma mocks.

If a test performs real DB mutations, file system changes, external API calls, or other stateful side effects that persist beyond the test (e.g., integration tests, seed scripts), wrap assertions in `try/finally` — a failing assertion skips cleanup and contaminates later tests:

```typescript
try {
  await doSomething();
  expect(result).toBe(expected);
} finally {
  await restoreState();
}
```

### File Split for Testability

When a service file mixes DB operations and pure functions, split it into two files:

- `crud.ts` — DB operations (`getXxx`, `updateXxx`, `createXxx`); tests need Prisma mocks
- `initializers.ts` — pure computation (grade grouping, priority assignment); tests need no mocks

Stop the split if internal helpers (e.g. `fetchUnplacedWorkbooks`) would be fragmented across files — cohesion matters more than the split itself.

## Component Vitest Unit Tests

E2E tests are complementary to, not a substitute for, unit tests. Add Vitest unit tests for any component logic (derived values, event handlers, utility calls) by extracting it to the nearest `utils/` file and testing there.

You may omit a component-level Vitest test when **both** conditions hold:

1. The component is template-only (no logic beyond prop bindings and simple `{#if}`/`{#each}` blocks that only render — no inline function calls, ternaries with side effects, derived computations, or nested logic)
2. The component's rendering paths are covered by E2E tests

When a component contains extracted logic (e.g. derived values, event handlers, utility calls), add unit tests for that logic in the nearest `utils/` file instead of testing the component directly.

## Testing Extracted Utilities

- Add tests at extraction time, not later
- For URL manipulation: assert the original URL is not mutated
- For multi-column operations (e.g., DnD): assert both source and destination columns

## HTTP Mocking

Use Nock for external HTTP calls. See `src/test/lib/clients/` for examples.
