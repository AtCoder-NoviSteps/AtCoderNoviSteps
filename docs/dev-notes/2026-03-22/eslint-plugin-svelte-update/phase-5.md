# Phase 5: `{#each}` ブロックへのキー追加

## 概要

`svelte/require-each-key` 警告に対応する。各 `{#each items as item}` ブロックに `(key)` 式を追加する。

**キーの選択基準（優先順）:**

1. `.id` — エンティティID（ワークブック、タグ等）
2. `.task_id` / `.contest_id` — タスク系
3. `.path` / `.value` — ナビゲーションリンク、選択肢
4. ユニーク文字列フィールド（タイトル等）
5. インデックス `i` — 最終手段（固有IDがない静的リスト等）

**変換パターン:**

```svelte
{#each items as item}        →  {#each items as item (item.id)}
{#each items as item, i}     →  {#each items as item, i (item.id)}
```

対象: 20ファイル、約25箇所

## タスク

### Task 5-1: Header.svelte（3箇所）

**対象ファイル:** `src/lib/components/Header.svelte`
**対象行:** 53行目、62行目、110行目

- [ ] ファイルを読み込んでアイテム構造を確認
- [ ] 53行目 (`navbarDashboardLinks`): `(navbarDashboardLink.path)` をキーに追加
- [ ] 62行目 (`navbarLinks`): `(navbarLink.path)` をキーに追加
- [ ] 110行目 (`externalLinks`): `(externalLink.path)` をキーに追加

### Task 5-2: lib/components 各種（9ファイル）

以下の各ファイルを読み込み、アイテムの構造に応じたキーを追加する:

- [ ] `src/lib/components/LabelWithTooltips.svelte:28` — アイテム構造確認してキー追加
- [ ] `src/lib/components/SubmissionStatus/UpdatingDropdown.svelte:201` — 同上
- [ ] `src/lib/components/TagForm.svelte:86` — 同上
- [ ] `src/lib/components/TagListForEdit.svelte:38, 42` — 同上
- [ ] `src/lib/components/TaskGradeList.svelte:49` — `.grade` 等でキー追加
- [ ] `src/lib/components/TaskGrades/GradeGuidelineTable.svelte:44` — 同上
- [ ] `src/lib/components/TaskList.svelte:98` — `.task_id` でキー追加
- [ ] `src/lib/components/TaskListForEdit.svelte:40, 45, 52, 59` — 同上
- [ ] `src/lib/components/TaskListSorted.svelte:35` — `.task_id` でキー追加
- [ ] `src/lib/components/TaskSearchBox.svelte:171` — 同上
- [ ] `src/lib/components/ThermometerProgressBar.svelte:82, 99` — `.name` 等でキー追加

### Task 5-3: routes 各種（7ファイル）

- [ ] `src/features/tasks/components/contest-table/TaskTable.svelte:193` — アイテム構造確認してキー追加
- [ ] `src/features/workbooks/components/detail/WorkBookTasksTable.svelte:169` — 同上
- [ ] `src/routes/(admin)/account_transfer/+page.svelte:127` — 同上
- [ ] `src/routes/(admin)/workbooks/order/_components/ColumnSelector.svelte:31` — `option.value` でキー追加
- [ ] `src/routes/(admin)/workbooks/order/_components/KanbanBoard.svelte:153, 166` — 同上
- [ ] `src/routes/about/SectionSnippets.svelte:38, 140` — 同上
- [ ] `src/routes/problems/[slug]/+page.svelte:64` — 同上
- [ ] `src/routes/workbooks/[slug]/+page.svelte:162` — 同上

### Task 5-4: 動作確認

- [ ] `pnpm lint` で `svelte/require-each-key` の warning が 0 件になったことを確認

## 完了条件

`svelte/require-each-key` に関する全 warning が解消していること。
