# Phase 4 Server Cache: Review + Simplify 結果

staging vs #3706 ブランチの差分に対するレビュー結果。

## 概要

`Cache<T>.getOrFetch()` メソッドを追加し、tasks / votes / workbooks の3ドメインでサーバーサイドキャッシュを導入。DB書き込み時の明示的キャッシュ無効化も実装。構造は `.claude/rules/server-cache.md` のパターンに忠実。

## テスト・型チェック結果

- `pnpm test:unit`: 全パス（既存の flaky テスト `test_helpers.test.ts` のパフォーマンステスト1件のみ失敗 — 本変更と無関係）
- `pnpm check`: エラー 0件

## Critical（要対応）

### 1. キャッシュスタンピード

- **箇所**: `src/lib/clients/cache.ts:129-140`
- **内容**: `getOrFetch` で同一キーへの並行リクエスト時、全てが `fetchFn` を呼ぶ。in-flight の Promise を共有する仕組みがない
- **修正案**: in-flight の `Promise` を `Map<string, Promise<T>>` で保持し、同一キーの並行呼び出しで共有する

```typescript
// "inflight" is a custom Map — not a JS/TS built-in.
// Stores pending Promises so concurrent callers share one fetchFn() instead of firing N duplicates.
private inflight = new Map<string, Promise<T>>();

async getOrFetch(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = this.get(key);

  if (cached !== undefined) {return cached};

  if (this.inflight.has(key)) {return this.inflight.get(key)!};

  const promise = fetchFn().then(
    (result) => { this.set(key, result); this.inflight.delete(key); return result; },
    (err)    => { this.inflight.delete(key); throw err; },
  );
  this.inflight.set(key, promise);
  return promise;
}
```

### 2. Vote キャッシュの無効化漏れ

- **箇所**: `src/features/votes/services/vote_grade.ts` — `upsertVoteGradeTables()`
- **内容**: DB に書き込むが `invalidateVoteCaches()` を呼んでいない。最大10分間古いデータを返す
- **修正案**: `upsertVoteGradeTables()` の DB 書き込み成功後に `invalidateVoteCaches()` を呼ぶ

## Medium（検討推奨）

### 3. `getOrFetch` が `undefined` をキャッシュできない

- **箇所**: `src/lib/clients/cache.ts:132`
- **内容**: `if (cached !== undefined)` のため `T = undefined` の場合に毎回 refetch。現在の呼び出し元では問題ないが、型レベルで `T` が無制約なので潜在的バグ
- **修正案**: `Cache<T extends {}>` と制約するか、`return cached as T` で型アサーション
- **補足**: `{}` は TS で `null` / `undefined` 以外の全型を受け入れる型。`T extends {}` とすると `T = undefined` が禁止され、`!== undefined` ナローイング後の `T & {}` が `T` に安全に代入できるようになる（[TS Handbook: Generic Constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html)）

### 4. `ContestTaskCache.getCachedOrFetch()` との重複

- **箇所**: `src/lib/clients/cache_strategy.ts:37-60`
- **内容**: 既存の `getCachedOrFetch()` と新しい `Cache.getOrFetch()` が同等のロジック。さらに既存側はエラーを `[] as unknown as T` で握りつぶすバグ持ち
- **修正案**: `ContestTaskCache.getCachedOrFetch()` を `Cache.getOrFetch()` に委譲するようリファクタリング

### 5. `getAllTasksWithVoteInfo()` がキャッシュをバイパス

- **箇所**: `src/features/votes/services/vote_statistics.ts:40-44`
- **内容**: 直接 `prisma.task.findMany()` と `prisma.votedGradeStatistics.findMany()` を呼ぶ。admin ページの鮮度要件なら意図的だが、明示的な判断が必要
- **備考**: `/tasks/grade` は admin ページのため鮮度優先でキャッシュ不要
- **対応方針**: 別PRで対応。変更は小規模（4-5ファイル、既存パターンの機械的適用）
  - `votes/server/cache.ts` — `Cache<TaskWithVoteInfo[]>` 追加 + `invalidate`/`dispose` 拡張
  - `votes/services/vote_statistics.ts` — `getAllTasksWithVoteInfo()` を `getCached*` でラップ
  - `votes/server/cache.test.ts` — 新キャッシュのテスト追加
  - `votes/services/vote_statistics.test.ts` — mock 更新
  - `src/lib/services/tasks.ts` — `updateTask()` に `invalidateVoteCaches()` 追加（grade 変更時の整合性）
- **参照**: `docs/dev-notes/2026-06-13/sveltekit-caching/plan.md`「votes 一覧」

### 6. `placementCache` の maxSize 不足

- **箇所**: `src/features/workbooks/server/cache.ts:9`
- **内容**: TaskGrade(~18) × 2(published/unpublished) + SolutionCategory(~15) × 2 = ~66 キーで、デフォルト maxSize=50 を超える可能性
- **修正案**: `new Cache<WorkbooksWithAuthors>(HOUR_MS, 100)` のように maxSize を引き上げ

## Low（許容範囲）

### 7. 3ドメインのキャッシュモジュールが同一パターン

- 各20-40行で小さく、共通ファクトリへの抽出は過剰抽象。現状で可

### 8. `invalidateWorkbookCaches()` が `clear()` で全消し

- 動的複合キー（`CURRICULUM:Q7:false` 等）のため `delete(key)` で個別削除が不可能。正当な判断

### 9. 5つの `setInterval` タイマー

- 軽量で低頻度（1時間 or 10分間隔）。テスト時は `dispose*Caches()` + `afterAll` で適切にクリーンアップ済み。実害なし

### 10. キャッシュキーが文字列リテラル

- 各 Cache インスタンスがスコープ限定されており、衝突リスクなし

## `cache.test.ts` 型エラー調査

### 現象

- `pnpm check`（svelte-check）ではエラー 0件
- `tsc --noEmit` や `vitest --typecheck` で発現する可能性あり

### 最有力候補: `T & {}` 代入不可

- **箇所**: `src/lib/clients/cache.ts:133` — `return cached;`
- **原因**: TypeScript 5.4+ で `T | undefined` を `!== undefined` で絞ると `T & {}` になるが、無制約な `T` に対して `T & {}` は `T` に代入可能と証明できない

```
Type 'T & {}' is not assignable to type 'T'.
  'T & {}' is assignable to the constraint of type 'T', but 'T' could be instantiated
  with a different subtype of constraint '{}'.
```

### 修正案

```typescript
// Option A: T を制約する
export class Cache<T extends {}> { ... }

// Option B: 型アサーション
if (cached !== undefined) {
  return cached as T;
}
```

## 優先順位まとめ

1. **キャッシュスタンピード対策** — in-flight Promise の共有（Critical #1）
2. **Vote 書き込み時の `invalidateVoteCaches()` 追加** — データ整合性（Critical #2）
3. **`placementCache` の maxSize 引き上げ** — 簡単な修正（Medium #6）
4. **`getOrFetch` の型安全性改善** — `T extends {}` 制約（Medium #3）
5. **`ContestTaskCache` のリファクタリング** — 重複排除 + バグ修正（Medium #4）
6. **`getAllTasksWithVoteInfo()` のキャッシュ方針決定** — 設計判断（Medium #5）
