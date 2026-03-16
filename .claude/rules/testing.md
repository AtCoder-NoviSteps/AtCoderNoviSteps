---
description: Testing rules and patterns
paths:
  - '**/*.test.ts'
  - '**/*.spec.ts'
  - 'tests/**'
  - 'src/test/**'
---

# Testing

## Test Integrity

- Never delete, comment out, or weaken assertions (e.g. `toEqual` → `toBeDefined`) to make tests pass
- Fix the implementation, not the test; if the test itself is wrong, explain why in a comment or commit message

## Test Types

| Type | Tool       | Location                                                          | Run Command             |
| ---- | ---------- | ----------------------------------------------------------------- | ----------------------- |
| Unit | Vitest     | `src/test/` (mirrors `src/lib/`) or co-located in `src/features/` | `pnpm test:unit`        |
| E2E  | Playwright | `tests/`                                                          | `pnpm test:integration` |

## Assertions

- Use `toBe(true)` / `toBe(false)` over `toBeTruthy()` / `toBeFalsy()`
- For DB query tests, assert `orderBy`, `include`, and other significant parameters with `expect.objectContaining` — not just `where`
- Enum membership: `in` traverses the prototype chain; use `Object.hasOwn(Enum, value)` instead

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

## Mock Helpers

Extract repeated mock patterns into a helper in the test file:

```typescript
function mockFindMany(value: WorkBookPlacements) {
  vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue(
    value as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
  );
}
```

## Testing Extracted Utilities

- Add tests at extraction time, not later
- For URL manipulation: assert the original URL is not mutated
- For multi-column operations (e.g., DnD): assert both source and destination columns

## Coverage

- Run `pnpm coverage` for coverage report
- Target: 80% lines, 70% branches

## HTTP Mocking

Use Nock for external HTTP calls. See `src/test/lib/clients/` for examples.
