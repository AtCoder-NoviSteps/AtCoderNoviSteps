# グレード管理テーブルに Pending 総問題数を表示

## Context

Issue [#3813](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3813)「「グレード管理」で pending の総問題数を表示できるようにしましょう」への対応。

管理者のグレード管理画面（`/(admin)/tasks/grade`）では、各問題に確定グレード（`task.grade`）を付与する。まだ確定していない問題は `TaskGrade.PENDING` を持つ。現状の見出しは検索ヒット数と総数（`{filteredTasks.length} / {tasks.length} 問`）しか示さず、「あとどれだけ未確定（PENDING）が残っているか」が一目で分からない。

Issue タイトルの「総問題数」より、Pending 件数は **検索結果ではなくデータセット全体（`tasks`）** を対象にカウントする。見出しに `Pending {件数} 問` を追記し、未確定の残作業量を常時把握できるようにする。

## 対象データ構造（確認済み）

- `TaskGradeTable.svelte` の `tasks` prop は `TaskWithVoteInfo[]`（`src/features/votes/services/vote_statistics.ts`）。確定グレードは `task.grade: TaskGrade`。
- `TaskGrade.PENDING === 'PENDING'`（`src/lib/types/task.ts:33`）。コンポーネントは既に `import { taskGradeValues, TaskGrade } from '$lib/types/task'` 済み。
- 既存のグレード別カウント util は存在しない（新規作成が妥当）。

## 設計判断

- ロジックは `_utils/` に抽出し TDD で進める（「コンポーネントは薄く保ち、ロジックは utils へ」という規約に合致）。
- 既存の `_utils/grade_table_filter.ts` に純粋関数 `countPendingTasks` を1つ追加する。グレード管理テーブルのヘルパーとして責務が近いため、新規ファイルは作らない。

### 却下した代替案

- **コンポーネント内 inline `$derived`**：`tasks.filter((task) => task.grade === TaskGrade.PENDING).length` を1行で書く案。最小変更だがテストが付かず、ロジックを utils へ寄せる規約から外れるため却下。

## 実装方針

### 変更ファイル

**1. `src/routes/(admin)/tasks/grade/_utils/grade_table_filter.test.ts`（テスト先行）**

`countPendingTasks` の `describe` を追加。既存の `buildTask` ヘルパー（`grade` デフォルトは `TaskGrade.PENDING`）を再利用。カバーするケース：

- PENDING と非 PENDING が混在 → PENDING の件数のみを返す
- 空配列 → `0`
- 全件 PENDING → 配列長と一致
- PENDING が0件 → `0`

**2. `src/routes/(admin)/tasks/grade/_utils/grade_table_filter.ts`（実装）**

`filterGradeTableTasks` の後に純粋関数を追加：

```typescript
import { TaskGrade } from '$lib/types/task';

/**
 * Counts tasks whose confirmed grade is still PENDING (not yet graded by an admin),
 * over the whole dataset — independent of the current search filter.
 */
export function countPendingTasks(tasks: TaskWithVoteInfo[]): number {
  return tasks.filter((task) => task.grade === TaskGrade.PENDING).length;
}
```

（`TaskGrade` の import を先頭に追加。`TaskWithVoteInfo` は既に import 済み。）

**3. `src/routes/(admin)/tasks/grade/_components/TaskGradeTable.svelte`（表示）**

- import に `countPendingTasks` を追加：`import { filterGradeTableTasks, countPendingTasks } from '../_utils/grade_table_filter';`
- `$derived` を追加：`const pendingCount = $derived(countPendingTasks(tasks));`
- 見出しを更新：

```svelte
<h2 class="text-xl font-semibold mb-4 dark:text-white">
  {title}（{filteredTasks.length} / {tasks.length} 問、Pending: {pendingCount} 問）
</h2>
```

## フェーズ

| Phase | 内容                                                       | リスク |
| ----- | ---------------------------------------------------------- | ------ |
| 1     | `countPendingTasks` のテスト追加（テスト先行、失敗を確認） | 低     |
| 2     | `countPendingTasks` 実装、テスト緑を確認                   | 低     |
| 3     | `TaskGradeTable.svelte` の import・`$derived`・見出し更新  | 低     |

## 検証

1. `pnpm test:unit src/routes/\(admin\)/tasks/grade/_utils/grade_table_filter.test.ts` — 追加した `countPendingTasks` テストが通ること。
2. `pnpm check` — 型エラーなし。
3. `pnpm lint` / `pnpm format` — 整形・lint 通過。
4. `pnpm dev` で `/(admin)/tasks/grade` を管理者で開き、見出しに `Pending N 問` が表示され、N がデータセット全体の未確定件数（検索文字列を変えても不変）であることを目視確認。

## 補足

- 見出しの文言・書式はユーザー指定（`（{filteredTasks.length} / {tasks.length} 問、Pending: {pendingCount} 問）`）に厳密に従う。
- Pending カウントは `filteredTasks` ではなく `tasks`（全件）基準。検索は空クエリ時に `filteredTasks` を空にする「検索ファースト UI」のため、全件基準でないと未確定残数が正しく出ない。
