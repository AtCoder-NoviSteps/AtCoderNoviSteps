# 計画: src/features/tasks/contest-table への再構成 (第一段階)

## Context

Issue #3169 に基づき、`src/lib/` に散在している contest-table 関連コードを
`src/features/tasks/` 以下に集約する。今回はリファクタリングの **第一段階** として、
**ファイルの移動とインポートパスの修正のみ** を行う（ロジック変更なし）。

参照ガイド: [`docs/guides/architecture.md`](../../../guides/architecture.md)

---

## 移動対象ファイル (8ファイル)

### ソースファイル (5ファイル)

| 移動元                                                   | 移動先                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/lib/components/TaskTables/TaskTable.svelte`         | `src/features/tasks/components/contest-table/TaskTable.svelte`         |
| `src/lib/components/TaskTables/TaskTableBodyCell.svelte` | `src/features/tasks/components/contest-table/TaskTableBodyCell.svelte` |
| `src/lib/types/contest_table_provider.ts`                | `src/features/tasks/types/contest-table/contest_table_provider.ts`     |
| `src/lib/utils/contest_table_provider.ts`                | `src/features/tasks/utils/contest-table/contest_table_provider.ts`     |
| `src/lib/stores/active_contest_type.svelte.ts`           | `src/features/tasks/stores/active_contest_type.svelte.ts`              |

### テストファイル (2ファイル、ソースに隣接配置)

| 移動元                                                   | 移動先                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/test/lib/utils/contest_table_provider.test.ts`      | `src/features/tasks/utils/contest-table/contest_table_provider.test.ts` |
| `src/test/lib/stores/active_contest_type.svelte.test.ts` | `src/features/tasks/stores/active_contest_type.svelte.test.ts`          |

### テストフィクスチャ (1ファイル)

| 移動元                                                    | 移動先                                                                |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/test/lib/utils/test_cases/contest_table_provider.ts` | `src/features/tasks/fixtures/contest-table/contest_table_provider.ts` |

---

## 移動しないファイル

以下は `contest.test.ts` からも参照されるため `src/test/lib` に残す:

- `src/test/lib/utils/test_cases/contest_name_and_task_index.ts`
- `src/test/lib/utils/test_cases/contest_name_labels.ts`
- `src/test/lib/utils/test_cases/contest_type.ts`

---

## インポートパスの修正

移動したファイル内の import のみ変更する。`$lib/` への参照は引き続きそのまま。

### 1. `src/features/tasks/utils/contest-table/contest_table_provider.ts`

- `from '$lib/types/contest_table_provider'`
  → `from '$features/tasks/types/contest-table/contest_table_provider'`

### 2. `src/features/tasks/stores/active_contest_type.svelte.ts`

- `from '$lib/utils/contest_table_provider'`
  → `from '$features/tasks/utils/contest-table/contest_table_provider'`

### 3. `src/features/tasks/components/contest-table/TaskTable.svelte`

- `from '$lib/types/contest_table_provider'`
  → `from '$features/tasks/types/contest-table/contest_table_provider'`
- `from '$lib/utils/contest_table_provider'`
  → `from '$features/tasks/utils/contest-table/contest_table_provider'`
- `from '$lib/stores/active_contest_type.svelte'`
  → `from '$features/tasks/stores/active_contest_type.svelte'`

### 4. `src/features/tasks/utils/contest-table/contest_table_provider.test.ts`

- `from '$lib/utils/contest_table_provider'`
  → `from '$features/tasks/utils/contest-table/contest_table_provider'`
- `from '$lib/types/contest_table_provider'`
  → `from '$features/tasks/types/contest-table/contest_table_provider'`
- `from './test_cases/contest_table_provider'`
  → `from '$features/tasks/fixtures/contest-table/contest_table_provider'`

### 5. `src/features/tasks/stores/active_contest_type.svelte.test.ts`

- `from '$lib/stores/active_contest_type.svelte'`
  → `from '$features/tasks/stores/active_contest_type.svelte'`

### 6. `src/features/tasks/fixtures/contest-table/contest_table_provider.ts`

- `from '$lib/types/task'` は変更なし（lib に残る）

### 7. `src/routes/problems/+page.svelte`

- `from '$lib/components/TaskTables/TaskTable.svelte'`
  → `from '$features/tasks/components/contest-table/TaskTable.svelte'`

---

## 設定変更

### `svelte.config.js` — `$features` エイリアス追加

```js
alias: {
  '@': resolve('./src'),
  $lib: resolve('./src/lib'),
  '$lib/*': resolve('./src/lib/*'),
  $features: resolve('./src/features'),       // 追加
  '$features/*': resolve('./src/features/*'), // 追加
},
```

### `vite.config.ts` — テスト include パターン更新

```ts
// 変更前
include: ['src/**/*.{test,spec}.{js,ts}'],

// 変更後（architecture.md の推奨に合わせて明示的に）
include: [
  'src/test/**/*.test.ts',      // 既存テスト（段階移行）
  'src/features/**/*.test.ts',  // feature 内コロケーションテスト
],
```

---

## 今後の候補ファイル (今回対象外)

- `src/lib/utils/contest_task_pair.ts` / `src/test/lib/utils/contest_task_pair.test.ts`
  → tasks ドメインへの移行候補（第二段階以降で検討）
- `src/lib/stores/active_problem_list_tab.svelte.ts`
  → architecture.md で tasks 抽出候補に記載あり

---

## 検証

1. `pnpm test:unit` でテストが全て通ること
2. `pnpm check` で型エラーがないこと
3. `pnpm build` でビルドが通ること
4. `/problems` ページで TaskTable が正常に表示されること（開発サーバー確認）

---

## 実施結果と教訓

### 結果

- `pnpm test:unit`: 27ファイル・1811テスト全通過
- `pnpm check`: 既知の無関係エラー（zod テスト・AuthForm）のみ。本件起因のエラーなし

### 教訓

1. **`git mv` でファイルを移動する**: `cp` + `rm` より git 履歴が追跡しやすい。`Write` ツールで新規作成しない。

2. **`$features` エイリアスを先に設定してからインポートを書く**: エイリアス未設定のまま移動ファイルを参照すると型チェックが壊れる。設定ファイル変更 → ファイル移動 → import 修正の順が安全。

3. **共有 test_cases は使用元を grep で確認してから移動判断する**: `contest_name_and_task_index.ts` 等は `contest.test.ts` からも参照されており、フィクスチャに移動すると `src/test/lib` 残存テストが壊れる。

4. **同一ディレクトリ内の相対 import は `./` を使う**: `TaskTable.svelte` → `TaskTableBodyCell.svelte` のように同じディレクトリに移動したコンポーネントは `$features/...` より `./` の方が明確。

5. **`pnpm check` の既存エラーは事前に把握しておく**: リファクタ起因か既存問題かを切り分けるために、作業前の状態を確認しておくとよい。
