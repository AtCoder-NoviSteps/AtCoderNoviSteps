# グレード管理ページ: テーブル分割 + ページネーション計画

## 概要

`src/routes/(admin)/tasks/grade/+page.svelte` の全問題を1テーブルにまとめていた表示を、
**pending（未確定）** と **非pending（確定済み）** の2テーブルに分割し、各テーブルにページネーションを追加する。

## 要件

- **Pendingテーブル**: 常に全件表示・ページネーション。独立した検索ボックス（絞り込み後もページネーション）。
- **非Pendingテーブル**: 検索するまで非表示（現行と同じ）。検索後は全マッチ結果をページネーション表示（上限なし）。
- 0件時: テーブルは表示し「0件」メッセージを表示。

## 設計

### 参照パターン

`src/routes/(admin)/tasks/+page.svelte` のページネーション実装を踏襲する:

- `PaginationNav` from `flowbite-svelte`
- `PAGE_SIZE = 20`
- `$effect(() => { filteredResults; currentPage = 1; })` で検索変更時にページリセット
- `pagedItems = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE))`
- `totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)))`

### 新コンポーネント: `TaskGradeTable.svelte`

**場所**: `src/routes/(admin)/tasks/grade/TaskGradeTable.svelte`

**Props**:

```typescript
interface Props {
  tasks: TaskWithVoteInfo[];
  requireSearch?: boolean; // default: false。pending=false, 非pending=true
}
```

**内部ロジック**:

```typescript
const PAGE_SIZE = 20;

let search = $state('');
let currentPage = $state(1);

const sortedTasks = $derived([...tasks].sort(compareByContestIdAndTaskId));

function applyFilter(tasks: TaskWithVoteInfo[], query: string): TaskWithVoteInfo[] {
  if (query.trim() === '') {
    return requireSearch ? [] : tasks;
  }

  return filterTasksBySearch(tasks, query, Infinity);
}

const filteredTasks = $derived(applyFilter(sortedTasks, search));
const isSearchEmpty = $derived(search.trim() === '');

// 検索/データ変更時にページリセット
$effect(() => {
  filteredTasks;
  currentPage = 1;
});

const totalPages = $derived(Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE)));
const pagedTasks = $derived(
  filteredTasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
);
```

**テーブルボディの分岐**:

- `requireSearch && isSearchEmpty` → 「問題名・問題ID・出典を入力してください」
- `filteredTasks.length === 0 && !isSearchEmpty` → 「該当する問題が見つかりませんでした」
- `filteredTasks.length === 0 && isSearchEmpty` → 「0件」（pending が空のケース）
- otherwise → `pagedTasks` でタスク行レンダリング + 上下に `PaginationNav`

`PaginationNav` は `{#snippet}` で1箇所定義して上下2回 `{@render}`（参照パターンと同じ）。

**備考**: `filterTasksBySearch` に `Infinity` を渡すことで全件マッチを取得可能（JS の `.slice(0, Infinity)` は全要素を返す）。

### 変更: `+page.svelte`

現行の `search` state・`sortedTasks`・`filteredTasks`・テーブルUIを削除。タスクをpending/非pendingに分割:

```typescript
const pendingTasks = $derived(data.tasks.filter((task) => task.grade === TaskGrade.PENDING));
const gradedTasks = $derived(data.tasks.filter((task) => task.grade !== TaskGrade.PENDING));
```

テンプレート（見出しスタイルは既存ページに合わせる）:

```svelte
<h2>Pending（{pendingTasks.length} 問）</h2>
<TaskGradeTable tasks={pendingTasks} requireSearch={false} />

<h2>グレードあり（{gradedTasks.length} 問）</h2>
<TaskGradeTable tasks={gradedTasks} requireSearch={true} />
```

## フェーズ

### Phase 1: TaskGradeTable コンポーネント作成

`src/routes/(admin)/tasks/grade/TaskGradeTable.svelte` を新規作成。

- 現行 `+page.svelte` のテーブルUI・`adminGradeCell` スニペットを移植
- 検索ボックス・ページネーション追加

### Phase 2: +page.svelte 修正

- タスクを pending / 非pending に分割
- TaskGradeTable を2インスタンス呼び出し
- 不要になった既存テーブルUI・検索ロジックを削除

## 変更ファイル

| ファイル                                               | 変更内容                                  |
| ------------------------------------------------------ | ----------------------------------------- |
| `src/routes/(admin)/tasks/grade/TaskGradeTable.svelte` | **新規作成**                              |
| `src/routes/(admin)/tasks/grade/+page.svelte`          | タスク分割 + TaskGradeTable 2インスタンス |

**変更なし**: `+page.server.ts`、`$lib/utils/task_filter.ts`

## 再利用する既存ユーティリティ

- `filterTasksBySearch()` — `$lib/utils/task_filter.ts`
- `compareByContestIdAndTaskId()`, `removeTaskIndexFromTitle()`, `getTaskGradeLabel()` — `$lib/utils/task`
- `addContestNameToTaskIndex()` — `$lib/utils/contest`
- `taskGradeValues`, `TaskGrade` — `$lib/types/task`
- `PaginationNav` — `flowbite-svelte`
- `GradeLabel`, `RelativeEvaluationBadge` — 既存コンポーネント

## 検証

1. `pnpm check` — 型エラーなし
2. `pnpm dev` でブラウザ確認:
   - Pendingテーブル: 全件表示・ページネーション動作・検索絞り込み
   - 非Pendingテーブル: 検索前は非表示プロンプト、検索後はページネーション付き全マッチ表示
   - グレードドロップダウンが両テーブルで機能すること
3. `pnpm test:unit` — 既存テスト通過
