# グレード別一覧で展開されないグレードの修正

## 概要

[issue #3460](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3460): 問題一覧のグレード別タブで、一部グレードのアコーディオンが展開できない不具合を修正する。

## 原因調査

### 根本原因

`TaskList.svelte` の `{#each}` キーに `task_id` 単独を使用しているが、`task_id` はユニークではない場合がある。

`getMergedTasksMap()`（`src/lib/services/tasks.ts`）は同一の `task_id` を持ちながら `contest_id` が異なるタスク（同じ問題が複数コンテストに登場するケース）を生成する。`ContestTaskPair` モデルがこのケースを管理している。

```
task_id: "typical90_s"  contest_id: "typical90"     ← baseTaskMap
task_id: "typical90_s"  contest_id: "tessoku-book"  ← additionalTaskMap（ContestTaskPairで追加）
```

この重複した `task_id` を持つ `TaskResult` が同一グレードに含まれると、`{#each}` のキーが重複する。Svelte の keyed `{#each}` は重複キーを正しく reconcile できず、`AccordionItem` の状態が不正になって展開できないグレードが発生する。

### PR #3442 との対比

PR #3442（[#3442](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/3442)）は同一構造のバグを修正：

- `TaskListForEdit.svelte` で `importTask.task_id` → `importTask.id`（真のユニークキーへ変更）

今回も同様に、真のユニーク識別子である `contest_id + task_id` の複合キーを使用する必要がある。

### 証拠

- `getMergedTasksMap` のコメント：「Handling cases where the same problem is used in different contests」
- `TableBodyRow` の `id={taskResult.contest_id + '-' + taskResult.task_id}`：すでに複合キーで DOM id の一意性を確保済み

## 全 `{#each}` キーの調査結果

コードベース全体で `{#each ... (key)}` パターンを持つ箇所を調査した結果：

| ファイル                                             | キー                  | 判定                          |
| ---------------------------------------------------- | --------------------- | ----------------------------- |
| `src/lib/components/TaskList.svelte:100`             | `taskResult.task_id`  | **要修正**                    |
| `src/lib/components/TaskListSorted.svelte:37`        | `taskResult.task_id`  | 安全（Mapで重複排除済み）     |
| `src/routes/votes/+page.svelte:60`                   | `task.task_id`        | 安全（DB `@unique` 制約あり） |
| `src/routes/(admin)/vote_management/+page.svelte:39` | `stat.taskId`         | 安全（集計テーブルのPK）      |
| その他                                               | `id` / enum値 / index | 安全                          |

**`TaskListSorted.svelte`** は `getTaskResultsOnlyResultExists()` が Map（`task_id` キー）で重複排除するため現時点では安全。ただし `getMergedTasksMap` を使うデータソースに変わった場合は壊れる可能性あり。

## 設計の判断

修正対象は `TaskList.svelte` のみ。`TableBodyRow` の `id` 属性が既に `contest_id + '-' + task_id` を使用しているため、同じセパレーターで統一する。

## 修正内容

**対象ファイル:** `src/lib/components/TaskList.svelte` (line 100)

```svelte
<!-- Before -->
{#each taskResults as taskResult (taskResult.task_id)}

<!-- After -->
{#each taskResults as taskResult (taskResult.contest_id + '-' + taskResult.task_id)}
```

## 検証方法

1. `pnpm test:unit` — ユニットテストの確認
2. `pnpm dev` でローカルサーバーを起動し `/problems` → グレード別タブで全グレードが展開できることを確認
3. 複数コンテストに登場する問題を含むグレード（例：典型90問、鉄則本）で特に確認
