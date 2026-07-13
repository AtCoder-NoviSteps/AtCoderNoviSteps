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
- **TDD exceptions**: skip test-first for exploratory spikes, type-only changes, and config files with no branching logic; write tests before implementation for all service/util/store code

## Test Types

| Type | Tool       | Location                  | Command          |
| ---- | ---------- | ------------------------- | ---------------- |
| Unit | Vitest     | `src/test/` or co-located | `pnpm test:unit` |
| E2E  | Playwright | `e2e/`                    | `pnpm test:e2e`  |

E2E files: **must** use `.spec.ts` extension (`.test.ts` not detected).

Route unit tests: `src/routes/**/*.test.ts` is included by `vite.config.ts`. **Never use `+` as a filename prefix** — SvelteKit reserves it and `pnpm check` will error. Name route test files `page_server.test.ts`, not `+page.server.test.ts`.

## Test Environment

Default is `node` (set in `vite.config.ts`). Only files touching the real DOM (`window` / `document` / `localStorage`) opt in with a top-of-file `// @vitest-environment jsdom`. **Never set jsdom globally** — most tests are pure units and per-file jsdom construction is ~5.5x slower.

### Toggling `browser` per describe

**Never register `vi.mock('$app/environment')` twice in one file.** Every `vi.mock` is hoisted above the imports and runs once before any test, so a `{ browser: false }` mock written inside an SSR `describe`/`beforeEach` silently overwrites the `{ browser: true }` one at the top — the whole file ends up pinned to `browser = false`, the localStorage branches never execute, and tests that "verify" them become false-positives while still passing.

Use **one dynamic mock** driven by a `vi.hoisted` flag, and toggle the flag in `beforeEach`. Default the flag to `false` so singletons constructed at import time stay SSR-safe:

```typescript
// @vitest-environment jsdom
const browserState = vi.hoisted(() => ({ value: false }));

vi.mock('$app/environment', () => ({
  get browser() {
    return browserState.value;
  },
}));

describe('MyStore', () => {
  beforeEach(() => {
    browserState.value = true;
    localStorage.clear();
  });
  // …
});

describe('MyStore in SSR', () => {
  beforeEach(() => {
    browserState.value = false;
  });
  // …
});
```

In jsdom files, do **not** stub localStorage with `vi.stubGlobal` — use jsdom's real `Storage` and assert on state (`localStorage.getItem(key)`), not on spy calls. Assert SSR by constructing a fresh store with data already in localStorage: it must return the default and leave `getItem(key)` null.

## Unit Testing Patterns

### Assertions

- Use `toBe(true)` / `toBe(false)` not `toBeTruthy()` / `toBeFalsy()`
- DB query tests: assert `orderBy`, `include` with `expect.objectContaining`, not just `where`
- Enum membership: `Object.hasOwn(Enum, value)` not `in` (avoids prototype chain)
- `Promise<void>`: `.resolves` requires a matcher — without one it does not assert and becomes a false-positive; use `await fn()` to assert no throw, or `.resolves.toBeUndefined()` for explicit form

```typescript
// ✓ Preferred: simplest way to assert Promise<void> does not throw
await ensureSessionOrRedirect(mockLocals);

// ✓ Also correct: explicit resolves form
await expect(ensureSessionOrRedirect(mockLocals)).resolves.toBeUndefined();

// ✗ Wrong: .resolves without a matcher does not assert anything (false-positive)
await expect(ensureSessionOrRedirect(mockLocals)).resolves;
```

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

### Cache Module Tests

Prevent timer leaks and test isolation:

```typescript
afterAll(() => disposeDomainCaches());
beforeEach(() => invalidateDomainCaches());
```

Mock cache modules in service tests so caching is bypassed:

```typescript
vi.mock('$lib/server/tasks/cache', () => ({
  getCachedTasksMap: (fetchFn: () => Promise<unknown>) => fetchFn(),
  invalidateTaskCaches: vi.fn(),
}));
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

### Parameterized Tests

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

### Mutable Module-Level Exports

When a module exports a mutable `const` object (e.g. an override map), mutate it directly in `beforeEach`/`afterEach` to test override paths — no `vi.mock` needed:

```typescript
import { buildFn, OVERRIDE_MAP } from './module';

beforeEach(() => {
  OVERRIDE_MAP['testKey'] = { '100': 'A', '102': 'C' };
});
afterEach(() => {
  delete OVERRIDE_MAP['testKey'];
});

test('uses override map when entry exists', () => {
  expect(buildFn('testKey', ['100', '102']).get('100')).toBe('A');
});
```

### Route load() Unit Tests

`load` in `+page.server.ts` is a plain async function — call it directly with a mock event. Pass `setHeaders` as a `vi.fn()` spy to assert whether and how headers are set. What unit tests **cannot** verify: whether the header actually reaches the wire, or that `Set-Cookie` is absent (auth mocks bypass that) — cover those in E2E.

```typescript
const createMockEvent = ({ session = null } = {}) =>
  ({
    locals: { auth: { validate: vi.fn().mockResolvedValue(session) } },
    url: { searchParams: { get: vi.fn().mockReturnValue(null) } },
    setHeaders: vi.fn(),
  }) as unknown as Parameters<typeof load>[0] & { setHeaders: ReturnType<typeof vi.fn> };
```

### Test Stubs

Parameter types **must match** production signature — use domain types (`TaskGrade`), not `string`. Mismatch compiles silently but breaks type safety.

## Component Testing

- Extract logic to `utils/` or `_utils/` and test there, not in component
- Omit component Vitest if template-only **and** E2E covers rendering paths

## Coverage

Cover meaningful boundaries: happy path, error cases, and edge cases specific to the domain (e.g. empty arrays, null, enum extremes). Run `pnpm coverage` to spot untested branches — treat low coverage as a signal to review, not a target to hit mechanically.

## Multiple Test Location Patterns

During migration, support both centralized (`src/test/`) and co-located (`src/features/`, `src/lib/`) tests.
Configure `vite.config.ts` with explicit ordering:

```typescript
include: [
  'src/lib/**/*.test.ts',        // shared utilities (adjacent)
  'src/test/**/*.test.ts',       // legacy centralized
  'src/features/**/*.test.ts',   // feature co-location
],
```

## Test Files Ship with Code

Never defer tests. For non-trivial logic without explicit test requirement, add them anyway.

## Mocking globalThis Properties

Save and restore `globalThis` state to prevent test leaks:

```typescript
const original = globalThis.location;

beforeEach(() => {
  Object.defineProperty(globalThis, 'location', {
    value: { origin: 'http://test' },
    writable: true,
  });
});

afterEach(() => {
  if (original !== undefined) {
    Object.defineProperty(globalThis, 'location', { value: original, writable: true });
  }
});
```

## Guard Clause Reachability

Ensure guard clauses don't make later code unreachable. Example anti-pattern:

```typescript
// Bad: 'http://localhost' is unreachable
if (location?.origin) return location.origin;
if (!browser) return '';
return 'http://localhost'; // Never reached in browser
```

Simplify to remove dead code after the final guard.
