# Phase 4 Server Cache: Review 対応計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** review.md の優先順位まとめ #1〜#5 を修正し、キャッシュの信頼性・型安全性・重複排除を改善する

**Architecture:** `Cache<T>` クラスに in-flight dedup を追加（#1）、サービス層の invalidation 漏れ修正（#2）、設定値修正（#3）、型制約強化（#4）、`ContestTaskCache` の `getCachedOrFetch` を `Cache.getOrFetch` に委譲（#5）

**Tech Stack:** TypeScript, Vitest, SvelteKit (server-only modules)

## Global Constraints

- TDD: テストを先に書き、失敗を確認してから実装
- `pnpm test:unit` で全テストパス確認
- `pnpm check` でエラー 0件確認
- サービス層のテストでは `vi.mock('$lib/server/database', ...)` を使用
- キャッシュモジュールのテストでは `afterAll(() => dispose*Caches())` でタイマークリーンアップ

---

### Task 1: キャッシュスタンピード対策 — in-flight Promise の共有

**Files:**

- Modify: `src/lib/clients/cache.ts:129-140` — `getOrFetch` に in-flight dedup 追加
- Modify: `src/lib/clients/cache.test.ts` — stampede テスト追加

**Interfaces:**

- Consumes: なし（既存 `Cache<T>` クラスの内部変更）
- Produces: `getOrFetch(key, fetchFn)` のシグネチャは変更なし。並行呼び出し時に fetchFn が1回だけ実行されるようになる

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/clients/cache.test.ts` の `describe('getOrFetch')` 内に以下を追加:

```typescript
describe('stampede prevention', () => {
  test('shares a single fetchFn call across concurrent requests for the same key', async () => {
    const cache = new Cache<string>();
    let resolvePromise: (value: string) => void;
    const fetchFn = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const promise1 = cache.getOrFetch('key', fetchFn);
    const promise2 = cache.getOrFetch('key', fetchFn);

    resolvePromise!('shared');
    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result1).toBe('shared');
    expect(result2).toBe('shared');
  });

  test('cleans up inflight entry after fetchFn resolves', async () => {
    const cache = new Cache<string>();
    const fetchFn = vi.fn().mockResolvedValue('done');
    await cache.getOrFetch('key', fetchFn);

    const fetchFn2 = vi.fn().mockResolvedValue('done2');
    vi.advanceTimersByTime(cache['timeToLive'] + 1);
    const result = await cache.getOrFetch('key', fetchFn2);

    expect(fetchFn2).toHaveBeenCalledTimes(1);
    expect(result).toBe('done2');
  });

  test('cleans up inflight entry and propagates error to all waiters on fetchFn failure', async () => {
    const cache = new Cache<string>();
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'));

    const results = await Promise.allSettled([
      cache.getOrFetch('key', fetchFn),
      cache.getOrFetch('key', fetchFn),
    ]);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual(expect.objectContaining({ status: 'rejected' }));
    expect(results[1]).toEqual(expect.objectContaining({ status: 'rejected' }));
    expect(cache.size).toBe(0);
  });

  test('does not share inflight between different keys', async () => {
    const cache = new Cache<string>();
    const fetchFnA = vi.fn().mockResolvedValue('a');
    const fetchFnB = vi.fn().mockResolvedValue('b');

    const [resultA, resultB] = await Promise.all([
      cache.getOrFetch('keyA', fetchFnA),
      cache.getOrFetch('keyB', fetchFnB),
    ]);

    expect(fetchFnA).toHaveBeenCalledTimes(1);
    expect(fetchFnB).toHaveBeenCalledTimes(1);
    expect(resultA).toBe('a');
    expect(resultB).toBe('b');
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `pnpm test:unit -- src/lib/clients/cache.test.ts`
Expected: `stampede prevention` の 4テストが FAIL（最初のテストは `fetchFn` が2回呼ばれるため）

- [ ] **Step 3: in-flight Map を追加して getOrFetch を修正**

`src/lib/clients/cache.ts` を修正:

クラスのプロパティに追加:

```typescript
private inflight = new Map<string, Promise<T>>();
```

`getOrFetch` メソッドを差し替え:

```typescript
async getOrFetch(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = this.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const pending = this.inflight.get(key);

  if (pending) {
    return pending;
  }

  const promise = fetchFn().then(
    (result) => {
      this.set(key, result);
      this.inflight.delete(key);
      return result;
    },
    (error) => {
      this.inflight.delete(key);
      throw error;
    },
  );
  this.inflight.set(key, promise);

  return promise;
}
```

`dispose` メソッドに `this.inflight.clear();` を追加:

```typescript
dispose(): void {
  clearInterval(this.cleanupInterval);
  this.cache.clear();
  this.inflight.clear();
}
```

- [ ] **Step 4: テストパスを確認**

Run: `pnpm test:unit -- src/lib/clients/cache.test.ts`
Expected: 全テスト PASS

- [ ] **Step 5: 全体テスト・型チェック**

Run: `pnpm test:unit && pnpm check`
Expected: エラー 0件

---

### Task 2: Vote 書き込み時の `invalidateVoteCaches()` 追加

**Files:**

- Modify: `src/features/votes/services/vote_grade.ts:1,72` — import 追加 + 呼び出し追加
- Modify: `src/features/votes/services/vote_grade.test.ts` — invalidation テスト追加

**Interfaces:**

- Consumes: `invalidateVoteCaches()` from `$features/votes/server/cache`
- Produces: `upsertVoteGradeTables()` が DB 書き込み成功後にキャッシュを無効化するようになる

- [ ] **Step 1: 失敗するテストを書く**

`src/features/votes/services/vote_grade.test.ts` に mock と テストを追加。

ファイル冒頭の `vi.mock('$lib/server/database', ...)` の後に追加:

```typescript
vi.mock('$features/votes/server/cache', () => ({
  invalidateVoteCaches: vi.fn(),
}));

import { invalidateVoteCaches } from '$features/votes/server/cache';
```

`beforeEach` 内に追加:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(invalidateVoteCaches).mockClear();
});
```

`describe('upsertVoteGradeTables')` 内に以下のテストを追加:

```typescript
test('invalidates vote caches after successful write', async () => {
  const tx = setupTransaction();
  tx.voteGrade.findUnique.mockResolvedValue(null);
  tx.voteGrade.upsert.mockResolvedValue({});
  tx.votedGradeCounter.upsert.mockResolvedValue({});
  tx.votedGradeCounter.findMany.mockResolvedValue([{ grade: TaskGrade.Q5, count: 1 }]);
  tx.task.findUnique.mockResolvedValue({ grade: TaskGrade.Q3 });

  await upsertVoteGradeTables('user-1', 'abc001_a', TaskGrade.Q5);

  expect(invalidateVoteCaches).toHaveBeenCalledTimes(1);
});

test('does not invalidate vote caches when grade is unchanged (early return)', async () => {
  const tx = setupTransaction();
  tx.voteGrade.findUnique.mockResolvedValue({ grade: TaskGrade.Q5 });

  await upsertVoteGradeTables('user-1', 'abc001_a', TaskGrade.Q5);

  expect(invalidateVoteCaches).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `pnpm test:unit -- src/features/votes/services/vote_grade.test.ts`
Expected: `invalidates vote caches after successful write` が FAIL（`invalidateVoteCaches` が呼ばれていない）

- [ ] **Step 3: `upsertVoteGradeTables` に invalidation を追加**

`src/features/votes/services/vote_grade.ts` を修正:

import に追加:

```typescript
import { invalidateVoteCaches } from '$features/votes/server/cache';
```

`upsertVoteGradeTables` の `return { success: true };` の直前に追加:

```typescript
  });

  invalidateVoteCaches();

  return { success: true };
```

注意: `invalidateVoteCaches()` は `$transaction` の **外側**、成功後に呼ぶ。トランザクション内で冪等リターン（`existing?.grade === grade`）した場合は `$transaction` のコールバックが早期リターンするだけで、外側の `invalidateVoteCaches()` は呼ばれてしまう。これを防ぐため、トランザクションの戻り値で判別する:

```typescript
export async function upsertVoteGradeTables(
  userId: string,
  taskId: string,
  grade: TaskGrade,
): Promise<{ success: true }> {
  const isUpdated = await prisma.$transaction(async (tx) => {
    const existing = await tx.voteGrade.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });

    if (existing?.grade === grade) {
      return false;
    }

    if (existing) {
      await decrementOldGradeCounter(tx, taskId, existing.grade);
    }
    await upsertVoteRecord(tx, userId, taskId, grade);
    await incrementNewGradeCounter(tx, taskId, grade);

    const latestCounters = await tx.votedGradeCounter.findMany({
      where: { taskId },
      orderBy: { grade: 'asc' },
    });

    const total = latestCounters.reduce((sum, counter) => sum + counter.count, 0);
    const taskRecord = await tx.task.findUnique({
      where: { task_id: taskId },
      select: { grade: true },
    });
    const minVotes =
      taskRecord?.grade === TaskGrade.PENDING
        ? MIN_VOTES_FOR_PROVISIONAL_GRADE
        : MIN_VOTES_FOR_STATISTICS;
    if (total < minVotes) {
      return true;
    }

    await updateVoteStatistics(tx, taskId, latestCounters, minVotes);

    return true;
  });

  if (isUpdated) {
    invalidateVoteCaches();
  }

  return { success: true };
}
```

- [ ] **Step 4: テストパスを確認**

Run: `pnpm test:unit -- src/features/votes/services/vote_grade.test.ts`
Expected: 全テスト PASS

- [ ] **Step 5: 全体テスト**

Run: `pnpm test:unit`
Expected: 全テスト PASS

---

### Task 3: `placementCache` の maxSize 引き上げ

**Files:**

- Modify: `src/features/workbooks/server/cache.ts:9` — maxSize パラメータ追加
- Modify: `src/features/workbooks/server/cache.test.ts` — maxSize 超過のテスト追加（オプション）

**Interfaces:**

- Consumes: `Cache<T>` コンストラクタの第2引数 `maxSize`
- Produces: 変更なし（挙動の正常化のみ）

- [ ] **Step 1: 失敗するテスト（省略可）**

maxSize 超過は `Cache<T>` 本体でテスト済み。ここでの変更は設定値の修正のみなので、テスト追加は不要。

- [ ] **Step 2: `placementCache` の maxSize を 100 に変更**

`src/features/workbooks/server/cache.ts` の9行目を修正:

```typescript
// Before:
const placementCache = new Cache<WorkbooksWithAuthors>(HOUR_MS);

// After:
const placementCache = new Cache<WorkbooksWithAuthors>(HOUR_MS, 100);
```

根拠: TaskGrade(19) × 2(published/unpublished) + SolutionCategory(15) × 2 = 68 キー。100 は十分な余裕を持つ。

- [ ] **Step 3: テスト確認**

Run: `pnpm test:unit -- src/features/workbooks/server/cache.test.ts`
Expected: 全テスト PASS

---

### Task 4: `getOrFetch` の型安全性改善 — `T extends {}` 制約

**Files:**

- Modify: `src/lib/clients/cache.ts:8` — `Cache<T>` → `Cache<T extends {}>`
- Modify: `src/lib/clients/cache.test.ts:157` — `Cache<unknown>` → `Cache<Record<string, unknown>>` に変更

**Interfaces:**

- Consumes: なし
- Produces: `Cache<T extends {}>` — `T = undefined` と `T = null` が型レベルで禁止される。既存の本番呼び出し元（`Cache<string>`, `Cache<Map<...>>`, `Cache<WorkbooksWithAuthors>` 等）は全て `{}` を満たすため影響なし

**設計判断:**

- `return cached as T` の型アサーションは使わない。キャストは型チェッカーを黙らせるだけで `Cache<undefined>` のような誤用を防げない
- `T extends {}` は `null` と `undefined` の両方を禁止する。本番コードで `Cache<null>` や `Cache<string | null>` のインスタンスはゼロなので問題なし
- テスト側の `Cache<unknown>` は `unknown extends {}` が false のためコンパイルエラーになる → テストの意図（各種値型をキャッシュできること）に合った具体型 `Cache<Record<string, unknown>>` に変更する

- [ ] **Step 1: `Cache<T>` に型制約を追加**

`src/lib/clients/cache.ts` のクラス宣言を修正:

```typescript
// Before:
export class Cache<T> {

// After:
export class Cache<T extends {}> {
```

- [ ] **Step 2: テストの `Cache<unknown>` を修正**

`src/lib/clients/cache.test.ts` の `edge cases` → `expects to handle different value types` を修正:

```typescript
// Before:
const cache = new Cache<unknown>();

// After:
const cache = new Cache<Record<string, unknown>>();
```

テスト内の `cache.set('null', null)` 行を削除し、`expect(cache.get('null')).toBe(null)` も削除。`null` は `{}` を満たさないため `Cache<Record<string, unknown>>` に `null` を `set` できない。テストの目的は「各種値型をキャッシュできること」であり、`null` は `getOrFetch` の sentinel（`undefined`）と違って実用上キャッシュする必要がない。

修正後のテスト:

```typescript
test('expects to handle different value types', () => {
  const cache = new Cache<Record<string, unknown>>();

  cache.set('string', { value: 'test' });
  cache.set('number', { value: 123 });
  cache.set('boolean', { value: true });
  cache.set('object', { a: 1, b: 2 });
  cache.set('array', { items: [1, 2, 3] });

  expect(cache.get('string')).toEqual({ value: 'test' });
  expect(cache.get('number')).toEqual({ value: 123 });
  expect(cache.get('boolean')).toEqual({ value: true });
  expect(cache.get('object')).toEqual({ a: 1, b: 2 });
  expect(cache.get('array')).toEqual({ items: [1, 2, 3] });
});
```

- [ ] **Step 3: 型チェック・テスト確認**

Run: `pnpm check && pnpm test:unit -- src/lib/clients/cache.test.ts`
Expected: エラー 0件、全テスト PASS

---

### Task 5: `ContestTaskCache` のリファクタリング — `Cache.getOrFetch` への委譲

**Files:**

- Modify: `src/lib/clients/cache_strategy.ts:37-60` — `getCachedOrFetch` を `Cache.getOrFetch` に委譲
- Modify: `src/lib/clients/aizu_online_judge/clients.test.ts` — 既存テストがパスすることを確認（変更なし）

**Interfaces:**

- Consumes: `Cache<T>.getOrFetch(key, fetchFn)` (Task 1 で改善済み)
- Produces: `ContestTaskCache.getCachedOrFetchContests` / `getCachedOrFetchTasks` のシグネチャは変更なし。内部の `getCachedOrFetch<T>` が `Cache.getOrFetch` に委譲するようになる

- [ ] **Step 1: 既存テストがパスすることを確認**

Run: `pnpm test:unit -- src/lib/clients/aizu_online_judge/clients.test.ts`
Expected: 全テスト PASS（リファクタリング前のベースライン）

- [ ] **Step 2: `getCachedOrFetch` を `Cache.getOrFetch` に委譲**

`src/lib/clients/cache_strategy.ts` の `getCachedOrFetch` メソッドを修正:

```typescript
async getCachedOrFetch<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  cache: Cache<T>,
): Promise<T> {
  return cache.getOrFetch(key, fetchFunction);
}
```

これにより:

- `console.log` のキャッシュヒット/ミスログが除去される（`Cache.getOrFetch` はログを出さない）
- エラー時の `[] as unknown as T` バグが修正される（`Cache.getOrFetch` はエラーを伝播する）

- [ ] **Step 3: リファクタリング後にテストがパスすることを確認**

Run: `pnpm test:unit -- src/lib/clients/aizu_online_judge/clients.test.ts`
Expected: 全テスト PASS

- [ ] **Step 4: 全体テスト・型チェック**

Run: `pnpm test:unit && pnpm check`
Expected: エラー 0件

---

## 最終確認

- [ ] `pnpm test:unit` — 全テストパス
- [ ] `pnpm check` — 型エラー 0件
- [ ] `pnpm format` — フォーマット適用
- [ ] `pnpm lint` — lint エラー 0件
