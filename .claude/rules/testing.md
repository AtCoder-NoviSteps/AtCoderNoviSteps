---
description: Testing rules and patterns
paths:
  - '**/*.test.ts'
  - '**/*.spec.ts'
  - 'e2e/**'
  - 'src/test/**'
---

# Testing

## Principles

- **Tests ship with implementation** — same commit; feature not done until tests pass. Never defer tests for non-trivial logic
- **English only** — describe expected behavior (e.g., `'returns empty array when workbooks is empty'`)
- **Test integrity** — never weaken assertions to make tests pass; fix implementation instead
- **Unused imports** — signal missing tests, not dead code — add the test case first
- **TDD exceptions** — skip test-first for exploratory spikes, type-only changes, and config files with no branching logic
- **Component testing** — extract logic to `utils/`; omit component Vitest if template-only **and** E2E covers rendering paths
- **Coverage** — cover happy path, error cases, and domain edge cases (empty arrays, null, enum extremes). Treat low coverage as a signal to review, not a target

## File Layout & Environment

| Type | Tool       | Location                  | Command          |
| ---- | ---------- | ------------------------- | ---------------- |
| Unit | Vitest     | `src/test/` or co-located | `pnpm test:unit` |
| E2E  | Playwright | `e2e/`                    | `pnpm test:e2e`  |

- E2E files **must** use `.spec.ts` (`.test.ts` not detected)
- Route unit tests: name `page_server.test.ts`, never `+page.server.test.ts` (SvelteKit reserves `+` prefix)
- Both centralized (`src/test/`) and co-located (`src/features/`, `src/lib/`) test locations are supported — see `vite.config.ts` `include`

**Environment:** Default `node`. Only opt in to jsdom (`// @vitest-environment jsdom` at file top) when touching `window` / `document` / `localStorage`. Never set jsdom globally — per-file construction is ~5.5× slower.

## Assertions & Structure

- `toBe(true)` / `toBe(false)`, not `toBeTruthy()` / `toBeFalsy()`
- DB query tests: assert `orderBy`, `include` with `expect.objectContaining`, not just `where`
- Enum membership: `Object.hasOwn(Enum, value)`, not `in` (avoids prototype chain)
- `Promise<void>`: use `await fn()` to assert no throw, or `.resolves.toBeUndefined()`. **Never** bare `.resolves` (false-positive)
- **Stubs**: parameter types must match production signature — use domain types (`TaskGrade`), not `string`
- **Test data**: realistic values (real task IDs, grade names). Extract shared fixtures to file/describe scope; inline for single-use

Group by scenario, not flat:

```typescript
describe('validate', () => {
  describe('successful case', () => { ... });
  describe('error cases', () => {
    describe('returns false', () => { ... });
    describe('throws', () => { ... });
  });
});
```

Parameterized: test enum boundaries + typical value, then separate test for distinct behavior:

```typescript
test.each([TaskGrade.PENDING, TaskGrade.Q11, TaskGrade.Q10, TaskGrade.D6])(
  'returns grade %s', (grade) => { ... }
);
```

## Mocking

### Cleanup (Vitest v5)

- `clearMocks: true` is the v5 default — **never add `vi.clearAllMocks()`**; it clears call history only — `mockResolvedValue` / `vi.when()` implementations persist, so each test re-sets what it needs
- `restoreMocks` is still `false` — `vi.restoreAllMocks()` remains needed for `vi.spyOn`

### Service Layer (Prisma)

Mock with `vi.mock('$lib/server/database', ...)`. Use helpers:

```typescript
const mockFindUnique = (data) => db.task.findUnique.mockResolvedValue(data);
```

When the same mock is called with different arguments in one test, use `vi.when()` instead of `mockResolvedValueOnce` chains:

```typescript
vi.when(vi.mocked(prisma.workBook.findMany))
  .calledWith(
    expect.objectContaining({
      where: expect.objectContaining({ workBookType: WorkBookType.CURRICULUM }),
    }),
  )
  .thenResolve(curriculumRows);
```

### Cache Modules

```typescript
afterAll(() => disposeDomainCaches());
beforeEach(() => invalidateDomainCaches());

// Bypass caching in service tests:
vi.mock('$lib/server/tasks/cache', () => ({
  getCachedTasksMap: (fetchFn: () => Promise<unknown>) => fetchFn(),
  invalidateTaskCaches: vi.fn(),
}));
```

### HTTP (Nock)

Extract setup into helpers at describe scope:

```typescript
const mockGetUser = (statusCode, user?) => {
  nock('http://localhost')
    .get('/api/user')
    .reply(statusCode, user ? { user } : undefined);
};
```

### Environment Variables

Use `vi.stubEnv()` + `vi.unstubAllEnvs()` in `afterEach`.

### globalThis / Mutable Exports

Save and restore `globalThis` state via `Object.defineProperty` in `beforeEach`/`afterEach`.

For mutable module-level `const` objects (override maps), mutate directly in `beforeEach`/`afterEach` — no `vi.mock` needed.

## SvelteKit-Specific

### Browser Toggle per Describe

**Never register `vi.mock('$app/environment')` twice in one file** — the second hoisted call silently overwrites the first, pinning the whole file to one value. Use one dynamic mock with a `vi.hoisted` flag:

```typescript
// @vitest-environment jsdom
const browserState = vi.hoisted(() => ({ value: false }));
vi.mock('$app/environment', () => ({
  get browser() {
    return browserState.value;
  },
}));

// In browser describe: browserState.value = true; construct fresh instance
// In SSR describe: browserState.value = false
```

**Never assert a browser branch on the import-time singleton** — it is always constructed in SSR mode. Construct a fresh instance inside the browser `describe`.

In jsdom files, use jsdom's real `Storage` and assert state (`localStorage.getItem(key)`), not spy calls. Cover SSR guards separately:

- **read guard**: pre-seed localStorage, construct store, expect the default
- **write guard**: empty localStorage, call setter, expect `getItem(key)` still null

### Route load() Tests

Call `load` directly with a mock event. Pass `setHeaders` as `vi.fn()` to assert header behavior. Wire assertions cannot be verified in unit tests — cover in E2E.

```typescript
const createMockEvent = ({ session = null } = {}) =>
  ({
    locals: { auth: { validate: vi.fn().mockResolvedValue(session) } },
    url: { searchParams: { get: vi.fn().mockReturnValue(null) } },
    setHeaders: vi.fn(),
  }) as unknown as Parameters<typeof load>[0] & { setHeaders: ReturnType<typeof vi.fn> };
```
