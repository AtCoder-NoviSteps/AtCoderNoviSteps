# 設計ドキュメント: src/lib/clients 再編 (Phase 1–2)

## 概要

`src/lib/clients/` と `src/test/lib/clients/` を architecture.md の方針（テストはソースに隣接配置、共通テスト資産は `src/test/`）に沿って再編する。
AOJ/AtCoder の新コンテストへの拡張と、将来の他サイト追加を見越した構造整備が目的。

---

## 背景と動機

- テストが `src/test/lib/clients/` にあり、ソースとの距離が遠い（変更時に更新漏れが起きやすい）
- `aizu_online_judge.ts` (~640行) に 4 クラス + 10 以上の private 型が混在（責務過多）
- `ContestSiteApiClient` が `@deprecated` にもかかわらず両クライアントが継承中
- テストデータ（JSON）が `src/test/` 内にあり、生成スクリプト（`record_requests.ts`）と離れている

---

## 設計上の決定と却下案

### サイト別ディレクトリ vs 技術層別ディレクトリ

**採用: サイト別** (`aoj/`, `atcoder/`)

- Phase 3 での AOJ 内部分割、および将来の新サイト追加時に「1 ディレクトリ追加で完結」する Open-Closed に近い構造になる
- 技術層別 (`types/`, `utils/`) では AOJ 固有型と AtCoder 固有型が混在し責務の境界が曖昧になる

**却下: 各サイトに `types/` サブディレクトリを作る**

- AOJ の固有型は 10 個程度、AtCoder はほぼゼロ → `types.ts` 1 ファイルで十分
- ディレクトリを掘るのは 3 ファイル以上になってから（YAGNI）

### `loadMockData` の扱い

**採用: `src/lib/clients/fixtures/helpers.ts` に移動**

- `loadMockData` を使うのはクライアントテスト 2 本のみ（他の `src/test/` テストは不使用）
- `test_helpers.ts` から抽出し、`test_helpers.test.ts` からも対応する test block を削除
- `test_helpers.ts` には汎用ユーティリティ (`createTestCase`, `runTests`, `zip`) のみ残す

**却下: `$test` エイリアス追加**

- 設定ファイル変更が必要なわりに、実際に `loadMockData` を使うのはクライアント層のみ
- 適切な場所への移動で解決する方が直接的

### `ContestSiteApiClient` (deprecated) の除去タイミング

**採用: Phase 2 で除去**

- `AtCoderProblemsApiClient` が `this.fetchApiWithConfig` を継承経由で使っており、`HttpRequestClient` への差し替えが容易
- サイト別ディレクトリへの移動と同時にやると手戻りがなく、`http_client.ts` がクリーンになる

---

## ターゲット構造

```
src/lib/clients/
├── aizu_online_judge/
│   ├── types.ts                   # AOJ API 生レスポンス型 (Phase 2 で分離)
│   ├── utils.ts                   # buildEndpoint, mapToContest, mapToTask など (Phase 2)
│   ├── utils.test.ts              # utils の単体テスト (Phase 2、TDD)
│   ├── clients.ts                 # AojApiClient, AojTasksApiClientBase, etc. (Phase 2 移動)
│   └── clients.test.ts            # co-locate (Phase 1 移動)
├── atcoder/
│   ├── atcoder_problems.ts        # HttpRequestClient 移行済み (Phase 2 移動)
│   └── atcoder_problems.test.ts   # co-locate (Phase 1 移動)
├── fixtures/
│   ├── helpers.ts                 # loadMockData (Phase 1 抽出)
│   ├── helpers.test.ts            # loadMockData の単体テスト (Phase 1 移動)
│   ├── record_requests.ts         # テストデータ生成スクリプト (Phase 1 移動)
│   ├── aizu_online_judge/
│   │   ├── contests.json          # (Phase 1 移動)
│   │   └── tasks.json
│   └── atcoder/
│       ├── contests.json          # (Phase 1 移動)
│       └── tasks.json
├── cache.ts                       # 変更なし
├── cache.test.ts                  # co-locate (Phase 1 移動)
├── cache_strategy.ts              # 変更なし
├── http_client.ts                 # ContestSiteApiClient 削除 (Phase 2)
└── index.ts                       # import パス更新 (Phase 2)
```

---

## Phase 1: ファイル移動

### 移動対象

| 移動元                                              | 移動先                                             |
| --------------------------------------------------- | -------------------------------------------------- |
| `src/test/lib/clients/cache.test.ts`                | `src/lib/clients/cache.test.ts`                    |
| `src/test/lib/clients/clients.test.ts`    | `src/lib/clients/aizu_online_judge/clients.test.ts`    |
| `src/test/lib/clients/atcoder_problems.test.ts`     | `src/lib/clients/atcoder/atcoder_problems.test.ts` |
| `src/test/lib/clients/record_requests.ts`           | `src/lib/clients/fixtures/record_requests.ts`      |
| `src/test/lib/clients/test_data/aizu_online_judge/` | `src/lib/clients/fixtures/aizu_online_judge/`      |
| `src/test/lib/clients/test_data/atcoder_problems/`  | `src/lib/clients/fixtures/atcoder/`                |

### 抽出・新規作成

| 対象                  | 操作                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `loadMockData` 関数   | `src/test/lib/common/test_helpers.ts` から削除 → `src/lib/clients/fixtures/helpers.ts` に新規作成                                                |
| `loadMockData` テスト | `src/test/lib/common/test_helpers.test.ts` の `describe('loadMockData', ...)` ブロックを削除 → `src/lib/clients/fixtures/helpers.test.ts` に移動 |

### インポート更新

- `src/lib/clients/aizu_online_judge/clients.test.ts`: fixtures パスを `'./src/lib/clients/fixtures/aizu_online_judge/...'`、`loadMockData` を `'../fixtures/helpers'` から import
- `src/lib/clients/atcoder/atcoder_problems.test.ts`: 同上（atcoder）
- `src/lib/clients/cache.test.ts`: `$lib/clients/cache` への import はそのまま
- `src/lib/clients/fixtures/record_requests.ts`: `TEST_DATA_BASE_DIR` を新しい fixtures パスに更新

### 削除

- `src/test/lib/clients/` ディレクトリ（中身がすべて移動されたら削除）

---

## Phase 2: 責務の分割

### 2-1. AOJ クライアントをサイトディレクトリに移動

- `src/lib/clients/aizu_online_judge.ts` → `src/lib/clients/aizu_online_judge/clients.ts`

### 2-2. AOJ 型の分離

`aizu_online_judge/clients.ts` から以下を `aizu_online_judge/types.ts` に抽出:

- `AOJCourseAPI`, `Course`, `Courses`
- `ChallengeParams`, `ChallengeContestType`, `ChallengeRoundMap`, `PckRound`, `JagRound`
- `AOJChallengeContestAPI`, `ChallengeContest`, `ChallengeContests`
- `AOJTaskAPI`, `AOJTaskAPIs`
- 定数 `PENDING`

### 2-3. AOJ ユーティリティの分離（TDD）

`aizu_online_judge/clients.ts` の protected/private メソッドのうち、純粋関数を `aizu_online_judge/utils.ts` に抽出:

| 関数                            | 現在の場所                        | 移動先         |
| ------------------------------- | --------------------------------- | -------------- |
| `buildEndpoint(segments)`       | `AojTasksApiClientBase` protected | `aizu_online_judge/utils.ts` |
| `mapToContest(id, title)`       | `AojTasksApiClientBase` protected | `aizu_online_judge/utils.ts` |
| `mapToTask(problem, contestId)` | `AojTasksApiClientBase` protected | `aizu_online_judge/utils.ts` |
| `getCourseName(taskId)`         | `AojCoursesApiClient` private     | `aizu_online_judge/utils.ts` |

**実装手順**: `utils.test.ts` を先に書いてから `utils.ts` に実装（TDD）。

残留（クラス固有のため移動しない）:

- `printLogForFetchedResults`（副作用あり）
- `getCacheKey`, `validateApiResponse`, `transformToContests`, `transformToTasks`（Phase 3 スコープ）

### 2-4. AtCoder クライアントのサイトディレクトリ移動 + deprecated 移行

- `src/lib/clients/atcoder_problems.ts` → `src/lib/clients/atcoder/atcoder_problems.ts`
- `AtCoderProblemsApiClient` を `ContestSiteApiClient` の継承から `HttpRequestClient` の注入に変更:

```typescript
// Before (deprecated 継承)
export class AtCoderProblemsApiClient extends ContestSiteApiClient {
  async getContests(): Promise<ContestsForImport> {
    return this.fetchApiWithConfig({ baseApiUrl: ATCODER_PROBLEMS_API_BASE_URL, ... });
  }
}

// After (HttpRequestClient 注入)
export class AtCoderProblemsApiClient {
  constructor(
    private readonly http = new HttpRequestClient(ATCODER_PROBLEMS_API_BASE_URL)
  ) {}

  async getContests(): Promise<ContestsForImport> {
    return this.http.fetchApiWithConfig({ endpoint: 'contests.json', ... });
  }
}
```

### 2-5. `ContestSiteApiClient` の除去

`src/lib/clients/http_client.ts` から削除:

- `ContestSiteApiClient` abstract class
- `FetchAPIConfig.baseApiUrl` optional property（deprecated フィールド）

残留（使用中のため保持）:

- `TasksApiClient<T>` interface
- `HttpRequestClient` class
- `FetchAPIConfig<T>` type（`baseApiUrl` フィールド削除後）
- `fetchAPI<T>` 関数

### 2-6. `AojApiClient` の型変更

`AojApiClient extends ContestSiteApiClient` → `implements TasksApiClient<void>` へ変更。

### 2-7. 関連ファイルのインポート更新

- `src/lib/clients/index.ts`: `./aizu_online_judge/clients`, `./atcoder/atcoder_problems` に更新
- `src/lib/clients/fixtures/record_requests.ts`: `ContestSiteApiClient` 型を `TasksApiClient<void>` に変更

---

## 検証方法

1. `pnpm test:unit` — 全ユニットテストが pass すること（vite.config の `src/lib/**/*.test.ts` が既に登録済み）
2. `pnpm check` — Svelte/TypeScript 型チェックが pass すること
3. `pnpm lint` — lint エラーなし
4. `pnpm build` — ビルドが成功すること
5. `src/test/lib/clients/` ディレクトリが存在しないこと（移動完了の確認）

---

## スコープ外（Phase 3）

- `AojApiClient` 内部での連続 API 呼び出し設計の改善（`fetchAllData` パターン）
- `AojChallengesApiClient`, `AojCoursesApiClient` の個別ファイル分割
- `AojTasksApiClientBase` の設計見直し（Open-Closed 対応）
- コンテスト種別の enum 化による型安全性向上
