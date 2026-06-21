# votes-cache-optimization レビュー

staging..#3708 の差分に対するコードレビュー + simplify + 型エラー分析。

## 変更概要

| ファイル | 内容 |
|---|---|
| `src/features/votes/server/cache.ts` | `allTasksWithVoteInfoCache` 追加、`invalidateVoteCaches` / `disposeVoteCaches` 拡張 |
| `src/features/votes/services/vote_statistics.ts` | `getAllTasksWithVoteInfo()` を `getCachedAllTasksWithVoteInfo` でラップ、内部関数 `fetchAllTasksWithVoteInfo` 抽出 |
| `src/lib/services/tasks.ts` | `createTask()` / `updateTask()` に `invalidateVoteCaches()` 追加 |
| `src/routes/votes/+page.server.ts` | try-catch + `fetchFailed` フラグ + 匿名時 CDN cache-control |
| `src/routes/votes/page_server.test.ts` | 新規。load() のキャッシュヘッダーとデータ返却のテスト |
| `src/features/votes/server/cache.test.ts` | `getCachedAllTasksWithVoteInfo` のワイヤリング・invalidation テスト追加 |
| `src/features/votes/services/vote_statistics.test.ts` | mock に `getCachedAllTasksWithVoteInfo` 追加 |
| `src/test/lib/services/tasks.test.ts` | `invalidateVoteCaches` の呼び出し検証テスト追加 |

## コードレビュー

### Good

1. **cache.ts の設計が既存パターンと一貫**: `voteStatsCache` のリネーム、`allTasksWithVoteInfoCache` の追加、`invalidateVoteCaches` / `disposeVoteCaches` の拡張がすべて server-cache ルールに準拠。
2. **Invalidation 経路の網羅**: `createTask()` と `updateTask()` の両方に `invalidateVoteCaches()` を追加し、`updateTask` の P2025 パスでは呼ばない設計が正しい。テストでも検証済み。
3. **テストカバレッジ**: cache のワイヤリング、invalidation グルーピング、route の匿名/ログイン/degraded の 3 パターンすべてカバー。
4. **CDN キャッシュの匿名限定**: `/problems` と同じパターンで、ログイン時に setHeaders を呼ばない設計。

### Issues

#### Critical

なし。

#### High

なし（型エラーは修正済み）。

#### Medium

なし（以下すべて修正済み）。

#### 修正済み

1. **型エラー: `page_server.test.ts`** — `result!` の assert スタイルで解消（`pnpm check` 0 errors）
2. **plan.md との乖離: try-catch + degraded** — 実装が意図通り。plan のほうを実態に合わせて更新が必要
3. **`cache.test.ts` のキャスト** — `as unknown as import('@prisma/client').TaskGrade` を削除、`$lib/types/task` の `TaskGrade` をそのまま使用
4. **`+page.server.ts` の `dataOk` → `fetchFailed`** — 逆条件に変更（`if (!session && !fetchFailed)`）
5. **型注釈の簡略化** — `Awaited<ReturnType<typeof getAllTasksWithVoteInfo>>` → `TaskWithVoteInfo[]`

## Simplify 分析

### 既存コードとの再利用

- `cache.ts` のパターンは `$lib/server/tasks/cache.ts` と完全に同型。Cache<T> の汎用性がうまく活かされている。追加の抽象は不要。
- `vote_statistics.ts` の `fetchAllTasksWithVoteInfo` 抽出は適切。`getCachedAllTasksWithVoteInfo` にラムダを渡す代わりに名前付き関数を使う方が可読性が高い。

### 品質・効率

- cache.ts: 問題なし。2 つのキャッシュインスタンスが同一 TTL を共有しているのは意図的（同じドメイン）。
- invalidation: `createTask` / `updateTask` の両方でカバーされており、漏れなし。
- テスト: 各レイヤーで適切なモックが設定されており、テスト間の依存もない。

## 型エラー分析

### エラー内容

```
src/routes/votes/page_server.test.ts:78:19
  Property 'tasks' does not exist on type 'void | (Omit<PageData, RequiredKeys<T>> & ...)'
```

6 箇所すべて同一原因。line 78, 79, 88, 89, 98, 99。

### 原因

SvelteKit の `PageServerLoad` 型は `load()` の戻り値を `void | PageData` として推論する。`void` は `load()` が明示的に `return` しないパスが型システム上存在しうることを示す。

テストで `const result = await load(event)` とすると、`result` の型が `void | PageData` になり、`result.tasks` に直接アクセスできない。

### 修正

assert スタイルで解消:

```typescript
const result = await load(event);
expect(result).toBeDefined();
expect(result!.tasks).toEqual([]);
expect(result!.isLoggedIn).toBe(false);
```

## まとめ

| 区分 | 件数 | 対応 |
|---|---|---|
| Critical | 0 | - |
| High | 0 | 型エラー修正済み |
| Medium | 0 | cache.test.ts キャスト統一済み |
| 修正済み | 5 | 型エラー、キャスト、fetchFailed 逆条件、型注釈簡略化、plan 乖離は意図通り |

テスト: 全 77 ファイル pass（2637 tests passed）。型チェック: 0 errors。
