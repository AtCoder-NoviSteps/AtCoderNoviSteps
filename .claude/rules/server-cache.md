---
description: Server-side caching rules
paths:
  - 'src/lib/clients/cache.ts'
  - 'src/lib/server/**/cache.ts'
  - 'src/features/**/server/cache.ts'
---

# Server-Side Cache

## Core Pattern: `Cache<T>.getOrFetch()`

Use `cache.getOrFetch(key, fetchFn)` for all get-or-fetch operations. Never inline the get/set/if pattern manually — it duplicates logic that `getOrFetch` already provides.

```typescript
export function getCachedFoo(fetchFn: () => Promise<Foo>): Promise<Foo> {
  return fooCache.getOrFetch(KEY, fetchFn);
}
```

## Domain Cache Module Structure

Place cache modules at `server/cache.ts` within each domain:

| Domain  | Path                                  |
| ------- | ------------------------------------- |
| Shared  | `src/lib/server/{domain}/cache.ts`    |
| Feature | `src/features/{name}/server/cache.ts` |

Each module exports:

- `getCached*()` — thin wrapper around `cache.getOrFetch()`
- `invalidate*Caches()` — clears all related cache instances
- `dispose*Caches()` — disposes all related cache instances (for test cleanup)

## Invalidation Rules

- Call `invalidate*Caches()` immediately after the DB write (`create`, `update`, `delete`) succeeds — not before, not in a `finally` block.
- Group related caches in a single invalidation function (e.g., `invalidateTaskCaches()` clears both `tasksCache` and `mergedTasksCache`).
- Never invalidate from route handlers — invalidation belongs in the service layer, co-located with the write operation.

## TTL Guidelines

| Data characteristics           | TTL        |
| ------------------------------ | ---------- |
| Rarely changes (tasks, grades) | 1 hour     |
| Moderately changes (votes)     | 10 minutes |

Adjust based on production metrics after deployment.

## Testing

Core cache behavior (hit, miss, TTL, error propagation) is tested on `Cache<T>.getOrFetch()` in `src/lib/clients/cache.test.ts`. Domain cache tests cover only domain-specific concerns:

- **Wiring**: wrapper delegates correctly and returns cached value on subsequent calls
- **Key isolation**: different parameters produce different cache keys (e.g., `buildPlacementKey`)
- **Invalidation grouping**: `invalidate*()` clears all related caches

Do not duplicate TTL or error propagation tests in domain cache test files.

Always call `afterAll(() => dispose*Caches())` to prevent timer leaks. Isolate tests with `beforeEach(() => invalidate*Caches())`.

## Type Constraint

`Cache<T extends {}>` — never use `null` or `undefined` as `T`. The cache uses `=== undefined` to detect misses; storing `undefined` would silently bypass the cache on every call.

## Stampede Prevention

`Cache<T>.getOrFetch()` shares a single in-flight `Promise` across concurrent callers for the same key. Do not implement manual dedup on top of it.

## Invalidation Audit

When adding a new DB write function, audit every write path in the same domain for missing `invalidate*Caches()` calls. Initial implementation of `upsertVoteGradeTables()` missed this and served stale data for up to 10 minutes.

## Service Layer Integration

Services call `getCached*()` with a `fetchFn` that performs the DB query. The service does not import `Cache` directly.

```typescript
// In service file
import { getCachedTasksMap } from '$lib/server/tasks/cache';

export async function getTasksByTaskId(): Promise<Map<string, Task>> {
  return getCachedTasksMap(async () => {
    const tasks = await db.task.findMany();
    return new Map(tasks.map((task) => [task.task_id, task]));
  });
}
```

Mock cache in service tests to bypass caching:

```typescript
vi.mock('$lib/server/tasks/cache', () => ({
  getCachedTasksMap: (fetchFn: () => Promise<unknown>) => fetchFn(),
  invalidateTaskCaches: vi.fn(),
}));
```
