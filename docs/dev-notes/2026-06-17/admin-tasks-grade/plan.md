# 管理者グレード管理画面の整理と使い勝手の向上（vote_management → /tasks/grade）

## 概要

`/vote_management` の機能は基本的にそのままに、ルート名の整理と検索・表示の改善を加えて `/tasks/grade` に移行する。

主な変更点:

- 「投票統計が存在する問題のみ」から「全問題」を対象とした一覧表示に変更
- 問題名・問題ID・コンテスト名による検索バーを追加（votes ページと同じ動作）
- 表示順を `compareByContestIdAndTaskId`（新しいコンテストが上）に統一
- 票数列を削除（検索で絞れるため不要）
- DBグレードの編集 UI は現行のまま（常時 `<select>` 表示 + `use:enhance` で非遷移更新）
- problems ページの `/tasks/[task_id]` リンクを削除

## 設計判断

### 既存サービス関数の再利用

`getAllTasksWithVoteInfo()`（`src/features/votes/services/vote_statistics.ts`）は:

- `prisma.task.findMany()` で**全タスク**を取得済み
- `estimatedGrade: TaskGrade | null`（VotedGradeStatistics 未存在なら null）を含む
- `task_id`, `title`, `contest_id` を持つため `SearchableTask` 型と互換

このため**新規サービス関数は不要**。

### ルート配置

`(admin)` はルートグループ（URL に影響しない）のため、`src/routes/(admin)/tasks/grade/` が `/tasks/grade` になる。既存の `(admin)/tasks/[task_id]`（静的 `grade` セグメントが動的ルートより優先）と競合しない。

### 検索動作

votes ページと揃え、検索ワード入力前は結果を表示しない。管理者向けだが、全件表示するとパフォーマンスが読みにくくなるため。上限は votes と同じ 20 件。

## 却下した代替案

| 案                                                      | 却下理由                                 |
| ------------------------------------------------------- | ---------------------------------------- |
| `src/features/tasks_grade/` として feature スコープ新設 | 新規サービス/型が不要なため YAGNI 違反   |
| `getAllTasksWithVoteInfo()` を拡張して全件対応          | すでに全件返している。修正不要           |
| クリックでドロップダウン表示（popover型）               | 現行の常時 select で十分。複雑化を避ける |
| 検索なしで全件初期表示                                  | 問題数が多く、意図せず重い表示になる恐れ |

## フェーズ計画

### Phase 1: 新ページ作成（サーバ + UI）

**対象ファイル（新規）:**

- `src/routes/(admin)/tasks/grade/+page.server.ts`
- `src/routes/(admin)/tasks/grade/+page.svelte`

**page.server.ts の実装:**

```typescript
// load: validateAdminAccess + getAllTasksWithVoteInfo()
// action: setTaskGrade（vote_management からコピー）
```

**page.svelte の実装:**

```
列構成:
  問題 (title → /votes/[slug] リンク)
  コンテスト (contest_id)
  DBグレード (<select> + GradeLabel + RelativeEvaluationBadge)
  中央値グレード (GradeLabel、null は空白)

クライアント側:
  $state search = ''
  sortedTasks = $derived([...data.tasks].sort(compareByContestIdAndTaskId))
  filteredTasks = $derived(filterTasksBySearch(sortedTasks, search, 20))
  search が空なら「問題名・問題ID・出典を入力してください」メッセージ表示
```

再利用コンポーネント/ユーティリティ:

- `GradeLabel` (`src/lib/components/GradeLabel.svelte`)
- `RelativeEvaluationBadge` (`src/features/votes/components/RelativeEvaluationBadge.svelte`)
- `compareByContestIdAndTaskId` (`src/lib/utils/task.ts`)
- `filterTasksBySearch` (`src/lib/utils/task_filter.ts`)
- `getAllTasksWithVoteInfo` (`src/features/votes/services/vote_statistics.ts`)

### Phase 2: 旧ページ削除 + ナビゲーション・E2E 更新

**削除:**

- `src/routes/(admin)/vote_management/+page.server.ts`
- `src/routes/(admin)/vote_management/+page.svelte`
- ディレクトリ `src/routes/(admin)/vote_management/`

**ナビゲーション更新（`src/lib/constants/navbar-links.ts`）:**

- `VOTE_MANAGEMENT_PAGE = '/vote_management'` → `TASKS_GRADE_PAGE = '/tasks/grade'` にリネーム
- `navbarDashboardLinks` のタイトル `投票管理` → `グレード管理`（または適切な名称）
- `navbarDashboardLinks` から `一覧表`（`PROBLEMS_PAGE` へのリンク）を削除（L28: `{ title: '一覧表', path: PROBLEMS_PAGE }`）

**E2E テスト更新:**

1. `e2e/votes.spec.ts`
   - `VOTE_MANAGEMENT_URL = '/vote_management'` → `/tasks/grade` に変更
   - `describe` ブロックの説明文を更新
   - ページ見出し (`投票管理`) のアサーションを新見出しに合わせて変更
   - 列ヘッダーのアサーション: `票数` 列削除 → 検索バーの存在確認を追加

2. `e2e/redirect_after_login.spec.ts` L65
   - `'/vote_management'` → `'/tasks/grade'` に変更

### Phase 3: problems ページの変更

**`src/lib/components/TaskList.svelte`**

- L130-141 の `{#if isAdmin}` ブロック全体を削除（`/(admin)/tasks/[task_id]` への「編集」リンク）

**`src/lib/components/TaskGradeList.svelte`**

- `isShowTaskList()` が `isAdmin === true` のとき PENDING を表示する設計になっている（L29-38）
- admin も含め PENDING を常に非表示にする。管理者のグレード編集は `/tasks/grade` で行う
- `isShowTaskList` 関数を削除し、`{#if}` を `taskGrade !== TaskGrade.PENDING` に単純化
- `isAdmin` prop は `TaskList` 側の `{#if isAdmin}` 削除に伴い不要になる可能性があるため合わせて確認

## 検証方法

1. `pnpm dev` でサーバ起動
2. 管理者アカウントでログインし `/tasks/grade` にアクセス
3. 検索ワードなし → 結果非表示を確認
4. 検索ワードあり → 最大 20 件、`compareByContestIdAndTaskId` 順で表示を確認
5. DBグレード変更 → ページ遷移なしで反映されることを確認
6. `/vote_management` → 404 になることを確認
7. `/problems` → `/tasks/[task_id]` リンクが消えていることを確認
8. `pnpm test:unit` でサービス層のテストが通ることを確認

## 調査済み事項

### ナビゲーションの `/vote_management` リンク

**ファイル:** `src/lib/constants/navbar-links.ts`

```typescript
// L16: 定数
export const VOTE_MANAGEMENT_PAGE = `/vote_management`;

// L29: 管理者ダッシュボードナビに使用
{ title: `投票管理`, path: VOTE_MANAGEMENT_PAGE },
```

**変更内容:**

- `VOTE_MANAGEMENT_PAGE` → `TASKS_GRADE_PAGE = '/tasks/grade'` にリネーム
- `navbarDashboardLinks` のタイトルを `グレード管理` 等に変更

### problems ページの `/tasks/[task_id]` リンク

**ファイル:** `src/lib/components/TaskList.svelte:133`

```svelte
{#if isAdmin}
  <a href={resolve('/(admin)/tasks/[task_id]', { task_id: taskResult.task_id })}> 編集 </a>
{/if}
```

`TaskList.svelte` は `problems` ページの「グレード別」タブ（`TaskGradeList` 経由）で使用されている共通コンポーネント。`{#if isAdmin}` ブロック全体を削除することで対応する。

> **注意:** `TagForm.svelte:113` にも同様のリンクがあるが、こちらはタグ管理画面のみで使用されるため今回の対象外。

## 今回のスコープ外（将来の検討事項）

- **`src/routes/(admin)/tasks/[task_id]/` の削除**: 現時点で一部利用があるため今回は対象外。リンクが完全になくなったことを確認後に削除する

- **管理者グレード管理ページへのキャッシュ付与**: 全問題データをロードするため、サーバ側でのレスポンスキャッシュが望ましいが、今回は対象外
- **グレード別タブの全面的な UI 刷新**: `problems` ページのグレード別タブ全体の再設計は別タスク
- **サーバ側フィルタリングへの移行**: 現状は全問ロード後にクライアント側で検索・絞り込みを行うが、コンテストやグレードでのサーバ側フィルタリングに切り替えることでパフォーマンスを改善できる可能性がある

## キャッシュ計画との関係（docs/dev-notes/2026-06-13/sveltekit-caching/plan.md）

`/tasks/grade` ページは admin 限定・低頻度であるため、キャッシュ計画では明示的にスコープ外（L149）とされており、今回のスコープで取り込める項目はない。

- **CDN キャッシュ（Phase 3 型）**: admin 認証必須のため共有キャッシュ不可
- **server-side キャッシュ（Phase 4）**: `cache.ts` 新設が必要な別タスク。`getAllTasksWithVoteInfo` はターゲット候補に挙がっているが今回は対象外

ただし **votes 修正方針（A/B）の前提「vote UI 改修の完了」は今回の作業で満たされる**。本 PR マージ後に `docs/dev-notes/2026-06-13/sveltekit-caching/plan.md` の votes 修正方針 A/B の着手可否を再評価すること。
