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

Unused imports signal a missing test, not dead code. Before deleting, add the corresponding test case.

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
- **Description ↔ code path alignment**: when a test name describes a specific scenario (e.g. "tie-break"), verify the fixture actually exercises that code path

### Fixture Sharing in describe() Scope

When multiple tests in a `describe` block use identical fixture data, define it once at block scope instead of duplicating in each test. Benefit: DRY + fixture changes sync automatically. Only use if fixture is immutable within tests (no mutations).

```typescript
describe('filterByRole', () => {
  const testGroups = [{ role: ADMIN }, { role: PENDING }];

  test('admin sees all', () => {
    expect(filter(testGroups, ADMIN)).toHaveLength(2);
  });
  test('user sees filtered', () => {
    expect(filter(testGroups, USER)).toHaveLength(1);
  });
});
```

## Coverage

- Run `pnpm coverage` for coverage report
- Target: 80% lines, 80% branches

## Test Order Mirrors Source Order

Order `describe` blocks in service and utils test files to match the declaration order of functions in the source file. Misalignment makes it harder to cross-reference tests and implementation.

### Describe Block Organization: Multi-Scenario Functions

Split `describe` blocks by scenario (not all cases flat) when a function behaves differently by mode. Example: separate `describe('func with modeA')` and `describe('func with modeB')` rather than mixing all cases. Benefit: better test discovery and names.

**Pattern: successful case vs error cases**

Organize functions by behavioral outcome: separate successful execution from failures (returns false, throws errors, etc.).

```typescript
describe('validate', () => {
  describe('successful case', () => {
    test('returns true and updates DB when external API confirms', async () => { ... });
  });

  describe('error cases', () => {
    describe('returns false', () => {
      test('when user has no AtCoderAccount', async () => { ... });
      test('when validation code is empty', async () => { ... });
    });

    describe('throws errors', () => {
      test('when user not found', async () => { ... });
      test('when external API returns non-OK response', async () => { ... });
    });
  });
});
```

When abnormal cases span multiple outcome types (graceful failures returning false vs exceptions), subdivide error cases by outcome. This clarifies caller behavior: some scenarios return false (can be handled inline), others throw (require try-catch).

## Service Layer Unit Tests

Service tests mock Prisma via `vi.mock('$lib/server/database', ...)` — no real DB mutations occur.

### Mock Helpers

Extract repeated mock patterns into helpers. Use `mockFindUnique`, `mockFindMany`, `mockCount` as the standard trio for Prisma model tests. Add `mockCreate`, `mockTransaction`, `mockDelete` when needed.

### Cleanup for Integration Tests

For tests with real side effects (DB mutations, file changes, API calls), wrap assertions in `try/finally` — a failing assertion skips cleanup and contaminates later tests.

### File Split for Testability

When a service mixes DB operations and pure functions, split into `crud.ts` (DB; Prisma mocks needed) and `initializers.ts` (pure; no mocks). Skip split if cohesion suffers.

## Component & Utility Tests

- Extract component logic to `utils/` and test there, not in the component.
- Omit component Vitest test if template-only **and** E2E tests cover rendering paths.
- Add utility tests at extraction time; assert immutability (URLs) and all affected parts (multi-column operations).

## HTTP Mocking

Use Nock for external HTTP calls. See `src/test/lib/clients/` for examples.

### HTTP Mock Helpers: DRY and Intent

Extract repeated HTTP mock setup into helpers at describe scope. Benefits: DRY, readable test names, easier assertion updates.

#### Naming convention

- Mock builder: `mock<Endpoint>()` (e.g. `mockGetMyVote()`, `mockPostSubmit()`)
- Data builder: `create<Entity>()` (e.g. `createFormData()`, `createRequestBody()`)

#### Pattern: declare once, use many

```typescript
describe('fetchUser', () => {
  const baseUrl = 'http://localhost';
  const endpoint = '/api/user';

  const mockGetUser = (statusCode: number, user?: User) => {
    nock(baseUrl)
      .get(endpoint)
      .reply(statusCode, user ? { user } : undefined);
  };

  test('success', async () => {
    mockGetUser(statusCodes.OK, { id: '1', name: 'Alice' });
    expect(await fetchUser()).toEqual({ id: '1', name: 'Alice' });
  });

  test('not found', async () => {
    mockGetUser(statusCodes.NOT_FOUND);
    expect(await fetchUser()).toBeNull();
  });
});
```

**Benefit**: Reduces duplication, clarifies each test's focus, simplifies mock updates across multiple tests.

## Parametrized Tests

When a function accepts domain enum values, test across representative samples rather than a single value.

#### Sampling strategy

- **Boundaries**: first value (Q11), last value (D6), special states (PENDING)
- **Mid-range**: one typical value (Q10)
- **Exception**: separate `test()` for distinct behavioral branches (e.g. null return)

#### Pattern: test.each() for variants

```typescript
// Bad: tests only one value
test('returns grade', async () => {
  mockGetVote(statusCodes.OK, TaskGrade.Q10);
  expect(await fetchVote()).toBe(TaskGrade.Q10);
});

// Good: parametrized boundaries + typical value
test.each([
  TaskGrade.PENDING,
  TaskGrade.Q11,
  TaskGrade.Q10,
  TaskGrade.Q1,
  TaskGrade.D1,
  TaskGrade.D6,
])('returns grade %s when voted', async (grade) => {
  mockGetVote(statusCodes.OK, grade);
  expect(await fetchVote()).toBe(grade);
});

// Separate test for distinct behavior
test('returns null when no vote', async () => {
  mockGetVote(statusCodes.OK, null);
  expect(await fetchVote()).toBeNull();
});
```

**Benefit**: Catches enum-related bugs (misspellings, missing cases); prevents regressions when enum values change.

## Environment Variable Stubs

Use `vi.stubEnv(key, value)` + `vi.unstubAllEnvs()` instead of manually assigning `process.env[key]` and deleting it in cleanup. `vi.stubEnv` syncs `import.meta.env` as well and accurately restores the original value:

```typescript
// Bad
beforeEach(() => {
  process.env.MY_URL = 'https://example.com';
});
afterEach(() => {
  delete process.env.MY_URL;
});

// Good
beforeEach(() => {
  vi.stubEnv('MY_URL', 'https://example.com');
});
afterEach(() => {
  vi.unstubAllEnvs();
});
```
