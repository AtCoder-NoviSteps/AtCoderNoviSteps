# Phase 4：共有データのサーバー側キャッシュ層 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DB クエリ結果をプロセス内 `Map`+TTL でキャッシュし、warm インスタンスでの Function Duration と不要な DB スキャンを削減する。

**Architecture:** `Cache<T>.getOrFetch(key, fetchFn)` で get-or-fetch パターンを汎用メソッドとして提供し、ドメインごとに `server/cache.ts`（Case C）で薄いラッパー関数 `getCached*(fetchFn)` を定義する。fetchFn は DB クエリ＋変換済みの型を返す責務を持つ。サービス関数はキャッシュの詳細を知らずに `getCached*()` を呼ぶだけでよい。

**Tech Stack:** TypeScript, Vitest, `Cache<T>` (src/lib/clients/cache.ts), Prisma/db singleton

> 調査・前提条件・Fluid Compute 検討は [survey.md](./survey.md)、設計判断（案A/B/C・HOF パターン・対象関数・テスト戦略）は [design.md](./design.md) を参照。

---

## Task 0: `Cache<T>.getOrFetch()` メソッドを追加する（テストから）

**Files:**

- Modify: `src/lib/clients/cache.ts`
- Modify: `src/lib/clients/cache.test.ts`

- [ ] **Step 1: テストを書く**

`src/lib/clients/cache.test.ts` の既存 `describe('Cache', ...)` 内に追加：

```typescript
describe('getOrFetch', () => {
  describe('successful case', () => {
    test('calls fetchFn and caches result on first invocation', async () => {
      const cache = new Cache<string>();
      const fetchFn = vi.fn().mockResolvedValue('fetched');
      const result = await cache.getOrFetch('key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('fetched');
    });

    test('returns cached value without calling fetchFn on subsequent calls', async () => {
      const cache = new Cache<string>();
      const fetchFn = vi.fn().mockResolvedValue('fetched');
      await cache.getOrFetch('key', fetchFn);
      await cache.getOrFetch('key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('error cases', () => {
    test('propagates fetchFn error without caching', async () => {
      const cache = new Cache<string>();
      const fetchFn = vi.fn().mockRejectedValue(new Error('fetch failed'));
      await expect(cache.getOrFetch('key', fetchFn)).rejects.toThrow('fetch failed');
      expect(cache.size).toBe(0);
    });

    test('retries fetchFn after a previous failure', async () => {
      const cache = new Cache<string>();
      const fetchFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue('retried');
      await expect(cache.getOrFetch('key', fetchFn)).rejects.toThrow('fetch failed');
      const result = await cache.getOrFetch('key', fetchFn);
      expect(result).toBe('retried');
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('boundary cases', () => {
    test('caches empty Map as valid value', async () => {
      const cache = new Cache<Map<string, unknown>>();
      const fetchFn = vi.fn().mockResolvedValue(new Map());
      await cache.getOrFetch('key', fetchFn);
      await cache.getOrFetch('key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('returns cached value just before TTL expires', async () => {
      const TTL = 1000;
      const cache = new Cache<string>(TTL);
      const fetchFn = vi.fn().mockResolvedValue('fetched');
      await cache.getOrFetch('key', fetchFn);
      vi.advanceTimersByTime(TTL - 1);
      await cache.getOrFetch('key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('calls fetchFn again after TTL expires', async () => {
      const TTL = 1000;
      const cache = new Cache<string>(TTL);
      const fetchFn = vi.fn().mockResolvedValue('fetched');
      await cache.getOrFetch('key', fetchFn);
      vi.advanceTimersByTime(TTL + 1);
      await cache.getOrFetch('key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm test:unit -- src/lib/clients/cache.test.ts
```

Expected: `getOrFetch` is not a function でエラー

- [ ] **Step 3: 実装を書く**

`src/lib/clients/cache.ts` の `Cache<T>` クラスに追加（`get()` メソッドの後）：

```typescript
async getOrFetch(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = this.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const result = await fetchFn();
  this.set(key, result);
  return result;
}
```

> `if (cached)` ではなく `if (cached !== undefined)` を使用。`get()` は miss 時に `undefined` を返すため、`null` や空配列などの falsy な `T` も正しくキャッシュされる。

- [ ] **Step 4: テストを通す**

```bash
pnpm test:unit -- src/lib/clients/cache.test.ts
```

Expected: 全 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/clients/cache.ts src/lib/clients/cache.test.ts
git commit -m "feat(cache): add getOrFetch method to Cache class"
```

---

## Task 1: キャッシュモジュール 3ファイルを作成する（テストから）

### 1a. `src/lib/server/tasks/cache.ts`

**Files:**

- Create: `src/lib/server/tasks/cache.ts`
- Create: `src/lib/server/tasks/cache.test.ts`

- [ ] **Step 1: テストを書く**

```typescript
// src/lib/server/tasks/cache.test.ts
import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import type { Task } from '$lib/types/task';
import {
  getCachedTasksMap,
  getCachedMergedTasksMap,
  invalidateTaskCaches,
  disposeTaskCaches,
} from './cache';

const taskEntry = new Map([['abc422_a', { task_id: 'abc422_a' } as unknown as Task]]);
const mockFetchFn = (data: Map<string, Task> = new Map()) => vi.fn().mockResolvedValue(data);

afterAll(() => disposeTaskCaches());

describe('getCachedTasksMap', () => {
  beforeEach(() => invalidateTaskCaches());
  afterEach(() => vi.restoreAllMocks());

  test('delegates to cache and returns fetched value', async () => {
    const fetchFn = mockFetchFn(taskEntry);
    const result = await getCachedTasksMap(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.get('abc422_a')?.task_id).toBe('abc422_a');
  });

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockFetchFn(taskEntry);
    await getCachedTasksMap(fetchFn);
    await getCachedTasksMap(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('getCachedMergedTasksMap', () => {
  beforeEach(() => invalidateTaskCaches());
  afterEach(() => vi.restoreAllMocks());

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockFetchFn();
    await getCachedMergedTasksMap(fetchFn);
    await getCachedMergedTasksMap(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('invalidateTaskCaches', () => {
  afterEach(() => vi.restoreAllMocks());

  test('clears both tasks and mergedTasks caches', async () => {
    const tasksFn = mockFetchFn();
    const mergedFn = mockFetchFn();
    await getCachedTasksMap(tasksFn);
    await getCachedMergedTasksMap(mergedFn);
    invalidateTaskCaches();
    await getCachedTasksMap(tasksFn);
    await getCachedMergedTasksMap(mergedFn);
    expect(tasksFn).toHaveBeenCalledTimes(2);
    expect(mergedFn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm test:unit -- src/lib/server/tasks/cache.test.ts
```

Expected: `tasks_cache` not found でエラー

- [ ] **Step 3: 実装を書く**

```typescript
// src/lib/server/tasks/cache.ts
import { Cache } from '$lib/clients/cache';
import type { Task } from '$lib/types/task';
import type { TaskMapByContestTaskPair } from '$lib/types/contest_task_pair';

const HOUR_MS = 60 * 60 * 1000;
const TASK_MAP_KEY = 'tasks_by_task_id';
const MERGED_KEY = 'merged_tasks_map';

const tasksCache = new Cache<Map<string, Task>>(HOUR_MS);
const mergedTasksCache = new Cache<TaskMapByContestTaskPair>(HOUR_MS);

export function getCachedTasksMap(
  fetchFn: () => Promise<Map<string, Task>>,
): Promise<Map<string, Task>> {
  return tasksCache.getOrFetch(TASK_MAP_KEY, fetchFn);
}

export function getCachedMergedTasksMap(
  fetchFn: () => Promise<TaskMapByContestTaskPair>,
): Promise<TaskMapByContestTaskPair> {
  return mergedTasksCache.getOrFetch(MERGED_KEY, fetchFn);
}

export function invalidateTaskCaches(): void {
  tasksCache.delete(TASK_MAP_KEY);
  mergedTasksCache.delete(MERGED_KEY);
}

export function disposeTaskCaches(): void {
  tasksCache.dispose();
  mergedTasksCache.dispose();
}
```

> 実際の型 import パスは `$lib/types/` 内を確認して合わせること。`TaskMapByContestTaskPair` は `$lib/types/contest_task_pair` にある。

- [ ] **Step 4: テストを通す**

```bash
pnpm test:unit -- src/lib/server/tasks/cache.test.ts
```

Expected: 全 PASS

---

### 1b. `src/features/votes/server/cache.ts`

**Files:**

- Create: `src/features/votes/server/cache.ts`
- Create: `src/features/votes/server/cache.test.ts`

- [ ] **Step 1: テストを書く**

```typescript
// src/features/votes/server/cache.test.ts
import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import type { VotedGradeStatistics } from '@prisma/client';
import { TaskGrade } from '$lib/types/task';
import { getCachedVoteStats, invalidateVoteCaches, disposeVoteCaches } from './cache';

const makeStats = (): Map<string, VotedGradeStatistics> =>
  new Map([
    [
      'abc408_d',
      {
        id: '1',
        taskId: 'abc408_d',
        grade: TaskGrade.Q1,
        isExperimental: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      } as unknown as VotedGradeStatistics,
    ],
  ]);
const mockStatsFn = () => vi.fn().mockResolvedValue(makeStats());

afterAll(() => disposeVoteCaches());

describe('getCachedVoteStats', () => {
  beforeEach(() => invalidateVoteCaches());
  afterEach(() => vi.restoreAllMocks());

  test('delegates to cache and returns fetched value', async () => {
    const fetchFn = mockStatsFn();
    const result = await getCachedVoteStats(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.get('abc408_d')?.grade).toBe(TaskGrade.Q1);
  });

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockStatsFn();
    await getCachedVoteStats(fetchFn);
    await getCachedVoteStats(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('invalidateVoteCaches', () => {
  afterEach(() => vi.restoreAllMocks());

  test('clears vote stats cache', async () => {
    const fetchFn = mockStatsFn();
    await getCachedVoteStats(fetchFn);
    invalidateVoteCaches();
    await getCachedVoteStats(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm test:unit -- src/features/votes/server/cache.test.ts
```

- [ ] **Step 3: 実装を書く**

```typescript
// src/features/votes/server/cache.ts
import { Cache } from '$lib/clients/cache';
import type { VotedGradeStatistics } from '@prisma/client';

const VOTE_STATS_TTL_MS = 10 * 60 * 1000;
const KEY = 'vote_grade_statistics';

const cache = new Cache<Map<string, VotedGradeStatistics>>(VOTE_STATS_TTL_MS);

export function getCachedVoteStats(
  fetchFn: () => Promise<Map<string, VotedGradeStatistics>>,
): Promise<Map<string, VotedGradeStatistics>> {
  return cache.getOrFetch(KEY, fetchFn);
}

export function invalidateVoteCaches(): void {
  cache.delete(KEY);
}

export function disposeVoteCaches(): void {
  cache.dispose();
}
```

- [ ] **Step 4: テストを通す**

```bash
pnpm test:unit -- src/features/votes/server/cache.test.ts
```

Expected: 全 PASS

---

### 1c. `src/features/workbooks/server/cache.ts`

**Files:**

- Create: `src/features/workbooks/server/cache.ts`
- Create: `src/features/workbooks/server/cache.test.ts`

- [ ] **Step 1: テストを書く**

```typescript
// src/features/workbooks/server/cache.test.ts
import { describe, test, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';

import type { PlacementQuery } from '$features/workbooks/types/workbook_placement';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';
import { WorkBookType } from '$features/workbooks/types/workbook';

import {
  getCachedWorkbooksByPlacement,
  getCachedWorkbooksByUser,
  invalidateWorkbookCaches,
  disposeWorkbookCaches,
} from './cache';

const solutionQuery: PlacementQuery = {
  workBookType: WorkBookType.SOLUTION,
  solutionCategory: SolutionCategory.SEARCH_SIMULATION,
};
const mockFetchFn = () => vi.fn().mockResolvedValue([]);

afterAll(() => disposeWorkbookCaches());

describe('getCachedWorkbooksByPlacement', () => {
  beforeEach(() => invalidateWorkbookCaches());
  afterEach(() => vi.restoreAllMocks());

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockFetchFn();
    await getCachedWorkbooksByPlacement(solutionQuery, false, fetchFn);
    await getCachedWorkbooksByPlacement(solutionQuery, false, fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('misses cache when solutionCategory differs', async () => {
    const fetchFn = mockFetchFn();
    const otherQuery: PlacementQuery = {
      ...solutionQuery,
      solutionCategory: SolutionCategory.DYNAMIC_PROGRAMMING,
    };
    await getCachedWorkbooksByPlacement(solutionQuery, false, fetchFn);
    await getCachedWorkbooksByPlacement(otherQuery, false, fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  test('misses cache when includeUnpublished differs', async () => {
    const fetchFn = mockFetchFn();
    await getCachedWorkbooksByPlacement(solutionQuery, false, fetchFn);
    await getCachedWorkbooksByPlacement(solutionQuery, true, fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

describe('getCachedWorkbooksByUser', () => {
  beforeEach(() => invalidateWorkbookCaches());
  afterEach(() => vi.restoreAllMocks());

  test('returns cached value on subsequent calls', async () => {
    const fetchFn = mockFetchFn();
    await getCachedWorkbooksByUser(fetchFn);
    await getCachedWorkbooksByUser(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('invalidateWorkbookCaches', () => {
  afterEach(() => vi.restoreAllMocks());

  test('clears both placement and user caches', async () => {
    const placementFn = mockFetchFn();
    const userFn = mockFetchFn();
    await getCachedWorkbooksByPlacement(solutionQuery, false, placementFn);
    await getCachedWorkbooksByUser(userFn);
    invalidateWorkbookCaches();
    await getCachedWorkbooksByPlacement(solutionQuery, false, placementFn);
    await getCachedWorkbooksByUser(userFn);
    expect(placementFn).toHaveBeenCalledTimes(2);
    expect(userFn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm test:unit -- src/features/workbooks/server/cache.test.ts
```

- [ ] **Step 3: 実装を書く**

```typescript
// src/features/workbooks/server/cache.ts
import { Cache } from '$lib/clients/cache';
import type { WorkbooksWithAuthors } from '$features/workbooks/types/workbook';
import { WorkBookType as WorkBookTypeConst } from '$features/workbooks/types/workbook';
import type { PlacementQuery } from '$features/workbooks/types/workbook_placement';

const HOUR_MS = 60 * 60 * 1000;
const BY_USER_KEY = 'workbooks_by_user';

const placementCache = new Cache<WorkbooksWithAuthors>(HOUR_MS);
const byUserCache = new Cache<WorkbooksWithAuthors>(HOUR_MS);

function buildPlacementKey(query: PlacementQuery, includeUnpublished: boolean): string {
  if (query.workBookType === WorkBookTypeConst.CURRICULUM) {
    return `CURRICULUM:${query.taskGrade}:${includeUnpublished}`;
  }

  return `SOLUTION:${query.solutionCategory}:${includeUnpublished}`;
}

export function getCachedWorkbooksByPlacement(
  query: PlacementQuery,
  includeUnpublished: boolean,
  fetchFn: () => Promise<WorkbooksWithAuthors>,
): Promise<WorkbooksWithAuthors> {
  const key = buildPlacementKey(query, includeUnpublished);
  return placementCache.getOrFetch(key, fetchFn);
}

export function getCachedWorkbooksByUser(
  fetchFn: () => Promise<WorkbooksWithAuthors>,
): Promise<WorkbooksWithAuthors> {
  return byUserCache.getOrFetch(BY_USER_KEY, fetchFn);
}

export function invalidateWorkbookCaches(): void {
  placementCache.clear();
  byUserCache.clear();
}

export function disposeWorkbookCaches(): void {
  placementCache.dispose();
  byUserCache.dispose();
}
```

- [ ] **Step 4: テストを通す**

```bash
pnpm test:unit -- src/features/workbooks/server/cache.test.ts
```

Expected: 全 PASS

- [ ] **Step 5: 全3ファイルまとめて Commit**

```bash
git add \
  src/lib/server/tasks/cache.ts \
  src/lib/server/tasks/cache.test.ts \
  src/features/votes/server/cache.ts \
  src/features/votes/server/cache.test.ts \
  src/features/workbooks/server/cache.ts \
  src/features/workbooks/server/cache.test.ts
git commit -m "feat(cache): add per-domain server cache modules using getOrFetch"
```

---

## Task 2: `getTasksByTaskId()` / `getMergedTasksMap()` をキャッシュ経由に変更する

**Files:**

- Modify: `src/lib/services/tasks.ts`
- Modify: `src/test/lib/services/tasks.test.ts`

- [ ] **Step 0: `getMergedTasksMap()` の本体ロジックを `buildMergedMap()` に抽出する**

既存の `getMergedTasksMap()` 内のマージロジック（`baseTaskMap` 構築〜`additionalTaskMap` 生成〜`return new Map(...)` まで）をプライベート関数 `buildMergedMap(tasks: Tasks, contestTaskPairs: ContestTaskPair[]): TaskMapByContestTaskPair` に抽出する。`getMergedTasksMap()` は `buildMergedMap()` を呼ぶだけに簡素化する。この段階でテストが通ることを確認してからキャッシュ統合に進む。

```bash
pnpm test:unit -- src/test/lib/services/tasks.test.ts
```

- [ ] **Step 1: import を追加し、2関数を修正する**

```typescript
// tasks.ts 先頭に追加:
import { getCachedTasksMap, getCachedMergedTasksMap } from '$lib/server/tasks/cache';

// getTasksByTaskId() を以下に置き換え:
export async function getTasksByTaskId(): Promise<Map<string, Task>> {
  return getCachedTasksMap(async () => {
    const tasks = await db.task.findMany();
    return new Map(tasks.map((task) => [task.task_id, task]));
  });
}

// getMergedTasksMap() を以下に置き換え:
export async function getMergedTasksMap(tasks?: Tasks): Promise<TaskMapByContestTaskPair> {
  if (tasks !== undefined) {
    const contestTaskPairs = await getContestTaskPairs();
    return buildMergedMap(tasks, contestTaskPairs);
  }

  return getCachedMergedTasksMap(async () => {
    const [allTasks, contestTaskPairs] = await Promise.all([getTasks(), getContestTaskPairs()]);
    return buildMergedMap(allTasks, contestTaskPairs);
  });
}
```

- [ ] **Step 2: 既存テストにキャッシュ mock を追加する**

`src/test/lib/services/tasks.test.ts` の先頭（他の `vi.mock` の近く）に追加：

```typescript
vi.mock('$lib/server/tasks/cache', () => ({
  getCachedTasksMap: (fetchFn: () => Promise<unknown>) => fetchFn(),
  getCachedMergedTasksMap: (fetchFn: () => Promise<unknown>) => fetchFn(),
  invalidateTaskCaches: vi.fn(),
}));
```

- [ ] **Step 3: 型チェック + テストを通す**

```bash
pnpm check && pnpm test:unit -- src/test/lib/services/tasks.test.ts
```

Expected: 既存テストが全 PASS

---

## Task 3: `createTask()` / `updateTask()` に invalidate を追加する

**Files:**

- Modify: `src/lib/services/tasks.ts`

- [ ] **Step 1: import に `invalidateTaskCaches` を追加し、write 関数に invalidate を追記する**

Task 2 で追加した import に `invalidateTaskCaches` を追加する：

```typescript
import {
  getCachedTasksMap,
  getCachedMergedTasksMap,
  invalidateTaskCaches,
} from '$lib/server/tasks/cache';
```

`createTask()` は早期リターンあり（タスク既存 or `contest_type === null`）。`invalidateTaskCaches()` は `db.task.create()` の直後（＝実際に DB 書き込みが行われた場合のみ）に追加する：

```typescript
// createTask() — db.task.create() の直後に追加:
invalidateTaskCaches();

// updateTask() — db.task.update() の直後（try ブロック内、console.log の後）に追加:
invalidateTaskCaches();
```

- [ ] **Step 2: テストを通す**

```bash
pnpm test:unit -- src/test/lib/services/tasks.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/tasks.ts src/test/lib/services/tasks.test.ts
git commit -m "feat(cache): wrap task getters with cache HOF, invalidate on writes"
```

---

## Task 4: `getVoteGradeStatistics()` をキャッシュ経由に変更する

**Files:**

- Modify: `src/features/votes/services/vote_statistics.ts`
- Modify: `src/features/votes/services/vote_statistics.test.ts`

- [ ] **Step 1: import を追加し、関数を修正する**

```typescript
// vote_statistics.ts 先頭に追加:
import { getCachedVoteStats } from '$features/votes/server/cache';

// getVoteGradeStatistics() を以下に置き換え:
export async function getVoteGradeStatistics(): Promise<Map<string, VotedGradeStatistics>> {
  return getCachedVoteStats(async () => {
    const allStats = await prisma.votedGradeStatistics.findMany();
    return new Map(allStats.map((stat) => [stat.taskId, stat]));
  });
}
```

- [ ] **Step 2: 既存テストにキャッシュ mock を追加する**

`src/features/votes/services/vote_statistics.test.ts` の先頭（他の `vi.mock` の近く）に追加：

```typescript
vi.mock('$features/votes/server/cache', () => ({
  getCachedVoteStats: (fetchFn: () => Promise<unknown>) => fetchFn(),
}));
```

- [ ] **Step 3: テストを通す**

```bash
pnpm check && pnpm test:unit -- src/features/votes/services/vote_statistics.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/features/votes/services/vote_statistics.ts src/features/votes/services/vote_statistics.test.ts
git commit -m "feat(cache): wrap getVoteGradeStatistics with cache HOF (10-min TTL)"
```

---

## Task 5: 問題集 getter をキャッシュ経由に変更し、writer に invalidate を追加する

**Files:**

- Modify: `src/features/workbooks/services/workbooks.ts`
- Modify: `src/features/workbooks/services/workbooks.test.ts`

- [ ] **Step 1: import を追加する**

```typescript
import {
  getCachedWorkbooksByPlacement,
  getCachedWorkbooksByUser,
  invalidateWorkbookCaches,
} from '$features/workbooks/server/cache';
```

- [ ] **Step 2: `getWorkbooksByPlacement()` を修正する**

```typescript
export async function getWorkbooksByPlacement(
  query: PlacementQuery,
  includeUnpublished = false,
): Promise<WorkbooksWithAuthors> {
  return getCachedWorkbooksByPlacement(query, includeUnpublished, async () => {
    const placementFilter = buildPlacementFilter(query);
    const workbooks = await db.workBook.findMany({
      where: {
        workBookType: query.workBookType,
        ...(includeUnpublished ? {} : { isPublished: true }),
        placement: placementFilter,
      },
      orderBy: { placement: { priority: 'asc' } },
      include: {
        user: { select: { username: true } },
        workBookTasks: { orderBy: { priority: 'asc' } },
      },
    });
    return mapWithAuthorName(workbooks);
  });
}
```

- [ ] **Step 3: `getWorkBooksCreatedByUsers()` を修正する**

```typescript
export async function getWorkBooksCreatedByUsers(): Promise<WorkbooksWithAuthors> {
  return getCachedWorkbooksByUser(async () => {
    const workbooks = await db.workBook.findMany({
      where: { workBookType: WorkBookTypeConst.CREATED_BY_USER },
      orderBy: { id: 'asc' },
      include: {
        user: { select: { username: true } },
        workBookTasks: { orderBy: { priority: 'asc' } },
      },
    });
    return mapWithAuthorName(workbooks);
  });
}
```

- [ ] **Step 4: `createWorkBook()` / `updateWorkBook()` / `deleteWorkBook()` の末尾に追加する**

```typescript
// 各関数の DB 書き込み完了後に追加:
invalidateWorkbookCaches();
```

`updateWorkBook()` は `await db.$transaction(...)` の後に追加すること。

- [ ] **Step 5: 既存テストにキャッシュ mock を追加する**

`src/features/workbooks/services/workbooks.test.ts` の先頭（他の `vi.mock` の近く）に追加：

```typescript
vi.mock('$features/workbooks/server/cache', () => ({
  getCachedWorkbooksByPlacement: (
    _query: unknown,
    _includeUnpublished: unknown,
    fetchFn: () => Promise<unknown>,
  ) => fetchFn(),
  getCachedWorkbooksByUser: (fetchFn: () => Promise<unknown>) => fetchFn(),
  invalidateWorkbookCaches: vi.fn(),
}));
```

- [ ] **Step 6: テストを通す**

```bash
pnpm check && pnpm test:unit
```

Expected: 全 PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/workbooks/services/workbooks.ts src/features/workbooks/services/workbooks.test.ts
git commit -m "feat(cache): wrap workbook getters with cache HOF, invalidate on writes"
```

---

## 検証

```bash
pnpm test:unit   # 全 PASS
pnpm check       # 型エラーなし
pnpm lint        # lint エラーなし
```

ローカル `pnpm dev` で `/workbooks`・`/problems` を2回アクセスし、2回目のサーバーログに DB クエリが出ないことを確認（開発環境は warm インスタンスが維持されないため参考程度）。

デプロイ後、Vercel ダッシュボードで Function Duration を 1〜2 週間観測。

---

## 残 TODO（本プランのスコープ外）

- 投票統計 TTL 最終調整（計測後 5〜15分の範囲で）
- `getAllTasksWithVoteInfo()` への Phase 4 拡張（votes UI 改修完了後に別チケット）
- Phase 5：問題集一覧の遅延ロード（本番転送量再計測後に判断）

---

## Draft: `.claude/rules/server-cache.md`

実装完了後に以下のルールファイルを作成する。

````markdown
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
````

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
