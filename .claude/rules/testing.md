---
description: Testing rules and patterns
paths:
  - '**/*.test.ts'
  - '**/*.spec.ts'
  - 'e2e/**'
  - 'src/test/**'
---

# Testing

## Core Principles

- **Tests ship with implementation**: same commit, feature not done until tests pass
- **English only**: describe expected behavior (e.g., `'returns empty array when workbooks is empty'`)
- **Test integrity**: never weaken assertions to make tests pass; fix implementation instead
- **Unused imports**: signal missing tests, not dead code—add the test case first

## Test Types

| Type | Tool       | Location                  | Command          |
| ---- | ---------- | ------------------------- | ---------------- |
| Unit | Vitest     | `src/test/` or co-located | `pnpm test:unit` |
| E2E  | Playwright | `e2e/`                    | `pnpm test:e2e`  |

E2E files: **must** use `.spec.ts` extension (`.test.ts` not detected).

## Unit Testing Patterns

### Assertions

- Use `toBe(true)` / `toBe(false)` not `toBeTruthy()` / `toBeFalsy()`
- DB query tests: assert `orderBy`, `include` with `expect.objectContaining`, not just `where`
- Enum membership: `Object.hasOwn(Enum, value)` not `in` (avoids prototype chain)

### Describe Organization

Group by scenario (successful vs error cases), not flat:

```typescript
describe('validate', () => {
  describe('successful case', () => { ... });
  describe('error cases', () => {
    describe('returns false', () => { ... });
    describe('throws', () => { ... });
  });
});
```

### Test Data

- Use realistic values (real task IDs, grade names), not `'t1'` placeholders
- Extract shared fixture data to file scope; inline for single-use
- Verify fixture alignment: test name "tie-break" must exercise that code path
- Shared fixtures at `describe` scope avoid duplication (DRY + auto-sync)

### Service Layer Mocking

Mock Prisma with `vi.mock('$lib/server/database', ...)` — no real DB mutations. Use helpers:

```typescript
const mockFindUnique = (data) => db.task.findUnique.mockResolvedValue(data);
const mockFindMany = (data) => db.task.findMany.mockResolvedValue(data);
```

### HTTP Mocking (Nock)

Extract setup into helpers, declare once at describe scope:

```typescript
const mockGetUser = (statusCode, user?) => {
  nock('http://localhost')
    .get('/api/user')
    .reply(statusCode, user ? { user } : undefined);
};
```

### Parametrized Tests

Test enum boundaries + typical value, then separate test for distinct behavior:

```typescript
test.each([TaskGrade.PENDING, TaskGrade.Q11, TaskGrade.Q10, TaskGrade.D6])(
  'returns grade %s', (grade) => { ... }
);
test('returns null when no vote', () => { ... });
```

### Environment Variables

Use `vi.stubEnv()` + `vi.unstubAllEnvs()`:

```typescript
beforeEach(() => {
  vi.stubEnv('MY_VAR', 'value');
});
afterEach(() => {
  vi.unstubAllEnvs();
});
```

### Test Stubs

Parameter types **must match** production signature — use domain types (`TaskGrade`), not `string`. Mismatch compiles silently but breaks type safety.

## Component Testing

- Extract logic to `utils/` or `_utils/` and test there, not in component
- Omit component Vitest if template-only **and** E2E covers rendering paths

## Coverage

Target: 80% lines, 80% branches. Run `pnpm coverage`.

## Test Files Ship with Code

Never defer tests. For non-trivial logic without explicit test requirement, add them anyway.
