---
description: Testing rules and patterns
paths:
  - '**/*.test.ts'
  - '**/*.spec.ts'
  - 'tests/**'
  - 'src/test/**'
---

# Testing

## Test Types

| Type | Tool       | Location                                                          | Run Command             |
| ---- | ---------- | ----------------------------------------------------------------- | ----------------------- |
| Unit | Vitest     | `src/test/` (mirrors `src/lib/`) or co-located in `src/features/` | `pnpm test:unit`        |
| E2E  | Playwright | `tests/`                                                          | `pnpm test:integration` |

## Unit Tests

- Use `@quramy/prisma-fabbrica` for test data factories
- Mock external APIs with Nock

## E2E Tests

- Place in `tests/` directory
- Use Playwright test utilities
- Test user flows, not implementation details

## Patterns

```typescript
import { describe, test, expect, vi } from 'vitest';

describe('functionName', () => {
  test('expects to do something', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Assertions

- Use `toBe(true)` / `toBe(false)` instead of `toBeTruthy()` / `toBeFalsy()` for boolean checks
- Be explicit about expected values
- For DB query tests, assert not only `where` but also `orderBy`, `include`, and other functionally significant parameters using `expect.objectContaining`

## Cleanup in Tests

Wrap DB-mutating test cleanup in `try/finally`. Without it, a failing assertion skips cleanup and contaminates subsequent tests:

```typescript
try {
  await doSomething();
  expect(result).toBe(expected);
} finally {
  await restoreState();
}
```

## Test Data

- Use realistic values from actual fixtures (e.g., real task IDs, grade names) instead of abstract placeholders like `'t1'`, `'t2'`
- This ensures test data stays consistent with production data and catches spec changes early
- Extract test data into fixture files when shared across multiple test cases. Inline data is fine for single-use cases
- When filtering fixture subsets with `.filter()`, verify the actual contents after filtering — the same ID may refer to a different entity if the fixture is updated

## Mock Helpers

When the same mock pattern (e.g., `vi.mocked(prisma.xxx.findMany).mockResolvedValue(...)`) appears across multiple tests, extract it into a helper function in the test file:

```typescript
function mockFindMany(value: WorkBookPlacements) {
  vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue(
    value as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
  );
}
```

## Testing Extracted Utilities

- When a function is extracted to `_utils/` to make it testable, add tests at extraction time — not later
- For URL manipulation tests, always assert that the original URL is not mutated (non-destructive)
- For multi-column operations (e.g., drag-and-drop between columns), assert both source and destination columns

## Coverage

- Run `pnpm coverage` for coverage report
- Target: 80% lines, 70% branches

## HTTP Mocking

- Use Nock for mocking external HTTP calls
- See `src/test/lib/clients/` for examples
