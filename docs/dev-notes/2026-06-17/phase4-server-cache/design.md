# Phase 4：設計判断

> 本ドキュメントは [plan.md](./plan.md) の設計背景。調査・前提条件は [survey.md](./survey.md)、実装手順は plan.md を参照。

## 設計判断の記録

### 却下：案A — `src/lib/server/cache.ts` 集約

**発想：** `database.ts` と同じく、キャッシュもインフラとして `lib/server/` に集約する。

**却下理由：**

- `database.ts` はドメイン型を一切持たない純粋なインフラ（Prisma 接続管理のみ）。一方、キャッシュは `WorkbooksWithAuthors`（features 型）など各ドメインの型を知る必要がある。`lib` が `features` に依存する逆転が生じる。
- 無関係なドメイン（タスク・投票統計・問題集）が1ファイルに同居する積極的な理由がない。タスクの TTL を変更したいだけなのに、投票統計の定義が同じファイルにある。
- `resetAllCaches()` はテスト専用コードが本番モジュールに漏れる形であり、かつ全ドメインを一括リセットする本番ユースケースが存在しない。

### 却下：案B — 各サービスファイル内にインスタンス

**発想：** `tasks.ts` の先頭に `const tasksCache = new Cache<...>()` を置く。

**却下理由：**

- シンプルだが `tasks.ts` はすでに `createTask`/`updateTask`/`getTasks`/`getTasksByTaskId`/`getMergedTasksMap` を持つ大きなファイル。DB アクセスにキャッシュ管理が混在する。
- テスト隔離のために `_resetTaskCachesForTest()` などを export すると、テスト用コードが本番モジュールに入る点は案Aと変わらない。形を変えて同じ問題が残る。

### 採用：案C — ドメイン別 `server/cache.ts`

各ドメインが自分専用のキャッシュモジュールを持つ：

```
src/lib/server/tasks/cache.ts          ← lib ドメイン（tasks）
src/features/votes/server/cache.ts     ← votes ドメイン
src/features/workbooks/server/cache.ts ← workbooks ドメイン
```

**採用理由：**

- `features` 型は `features` 内で完結し、アーキテクチャ違反がない。
- サービスファイルはクエリ＋変換責務に集中できる。
- TTL 設定・キャッシュキー・invalidate ロジックが同一ドメインファイルに閉じる。
- `server/` という名前は SvelteKit の `+page.server.ts` と文脈が異なるが、「サーバー専用コード」の意味では一貫している。features 内に新規ディレクトリ規約を追加するコストはあるが、ドメイン分離の恩恵で正当化できる。

---

## HOF パターンと fetchFn の責務

**高階関数（Higher-order function）パターン：**

```typescript
// src/features/votes/server/cache.ts
export async function getCachedVoteStats(
  fetchFn: () => Promise<Map<string, VotedGradeStatistics>>,
): Promise<Map<string, VotedGradeStatistics>> {
  const cached = cache.get(KEY);

  if (cached) {
    return cached;
  }

  const result = await fetchFn();
  cache.set(KEY, result);

  return result;
}
```

```typescript
// src/features/votes/services/vote_statistics.ts
export async function getVoteGradeStatistics(): Promise<Map<string, VotedGradeStatistics>> {
  return getCachedVoteStats(async () => {
    const allStats = await prisma.votedGradeStatistics.findMany();
    return new Map(allStats.map((stat) => [stat.taskId, stat]));
  });
}
```

**fetchFn が返すのは変換済みの型（raw ではない）：**

既存コードを確認すると、5関数すべて「Prisma raw → ドメイン型」の変換を関数内部で完結させている。キャッシュに格納するのも変換済みの型が合理的（キャッシュヒット時に変換コストをスキップできる）。変換はCRUD側（fetchFn の中）の責務とする。

```
getCachedVoteStats(fetchFn)
├── キャッシュヒット → fetchFn を呼ばずに Map を返す
└── キャッシュミス → fetchFn() を実行（DB + 変換）→ Map をキャッシュ → 返す
```

サービスファイルはキャッシュの存在・詳細を知らずに済む。

---

## 対象関数と TTL

| 関数                                    | キャッシュモジュール                     | TTL   | invalidate                     |
| --------------------------------------- | ---------------------------------------- | ----- | ------------------------------ |
| `getTasksByTaskId()`                    | `src/lib/server/tasks/cache.ts`          | 1時間 | `createTask` / `updateTask` 後 |
| `getMergedTasksMap()`（引数なし時のみ） | `src/lib/server/tasks/cache.ts`          | 1時間 | `createTask` / `updateTask` 後 |
| `getVoteGradeStatistics()`              | `src/features/votes/server/cache.ts`     | 10分  | TTL のみ（投票は高頻度 write） |
| `getWorkbooksByPlacement()`             | `src/features/workbooks/server/cache.ts` | 1時間 | workbook 書き込み系3関数後     |
| `getWorkBooksCreatedByUsers()`          | `src/features/workbooks/server/cache.ts` | 1時間 | workbook 書き込み系3関数後     |

`getMergedTasksMap(tasks?: Tasks)` は `tasks` 引数あり（フィルタ済みリストを渡すケース）の場合はキャッシュしない。実際の呼び出し元はすべて引数なし。

---

## ファイル構成

| 操作     | パス                                             | 内容                                                                                                                                  |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 新規作成 | `src/lib/server/tasks/cache.ts`                  | タスク系 `getCached*()` + `invalidateTaskCaches()`                                                                                    |
| 新規作成 | `src/features/votes/server/cache.ts`             | `getCachedVoteStats()` + `invalidateVoteCaches()`                                                                                     |
| 新規作成 | `src/features/workbooks/server/cache.ts`         | `getCachedWorkbooksByPlacement()` + `getCachedWorkbooksByUser()` + `invalidateWorkbookCaches()`                                       |
| 修正     | `src/lib/services/tasks.ts`                      | `getTasksByTaskId()`・`getMergedTasksMap()` を `getCached*()` 経由に。`createTask()`・`updateTask()` に `invalidateTaskCaches()` 追加 |
| 修正     | `src/features/votes/services/vote_statistics.ts` | `getVoteGradeStatistics()` を `getCachedVoteStats()` 経由に                                                                           |
| 修正     | `src/features/workbooks/services/workbooks.ts`   | getter 2関数を `getCached*()` 経由に。writer 3関数に `invalidateWorkbookCaches()` 追加                                                |
| 新規作成 | `src/lib/server/tasks/cache.test.ts`             | キャッシュ挙動テスト（hit/miss/TTL/invalidate）                                                                                       |
| 新規作成 | `src/features/votes/server/cache.test.ts`        | キャッシュ挙動テスト（hit/miss/TTL/invalidate）                                                                                       |
| 新規作成 | `src/features/workbooks/server/cache.test.ts`    | キャッシュ挙動テスト（hit/miss/invalidate）                                                                                           |

---

## テスト戦略

**キャッシュ挙動テスト** は `server/cache.test.ts` で行う（`Cache<T>` インスタンスを直接使い、`vi.useFakeTimers()` で TTL を検証）。

**`setInterval` リーク防止：** `Cache<T>` はコンストラクタで `setInterval()` を起動する。テスト終了後にタイマーが残るのを防ぐため、各キャッシュモジュールは `dispose*Caches()` を export し、`cache.test.ts` の `afterAll()` で呼ぶ。

**invalidate API の統一：** 3ドメインすべて `invalidate*Caches()` を public export する。votes は TTL のみで invalidate 不要だが、テストリセット用途として統一する（将来の write-through invalidation にも対応できる）。

**サービステスト** はキャッシュモジュールを `vi.mock()` で透過化する（`getCached*` が常に fetchFn を呼ぶよう差し替え）。サービステストはキャッシュを意識せず、DB クエリ・変換ロジックの正しさだけを検証する。

```typescript
// サービステストの例
vi.mock('$features/votes/server/cache', () => ({
  getCachedVoteStats: (fetchFn: () => Promise<unknown>) => fetchFn(),
}));
```
