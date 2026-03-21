# Phase 6: `CurriculumWorkBookList.svelte` リファクタリング

**レイヤー:** `src/features/workbooks/components/list/` | **リスク:** 中

ストア依存を除去し、グレード選択状態を `currentGrade` prop で受け取るよう変更する。サーバー側でグレードフィルタリングが済んでいるため、`$derived` の `getGradeMode === selectedGrade` フィルタを削除し、`splitWorkbooksByReplenishment()` に置き換える。

> `getGradeMode` / `workbookGradeModes` は `CurriculumTable` のグレード列表示で引き続き使われるため **削除しない**。

---

**Files:**

- Modify: `src/features/workbooks/components/list/CurriculumWorkBookList.svelte`

- [x] **Step 1: ファイルを読んで現在の構造を確認**

削除対象となる行を特定する:

- `import { get } from 'svelte/store'`
- `import { taskGradesByWorkBookTypeStore } from '.../task_grades_by_workbook_type'`
- `WorkBookType` インポート（他で使われていなければ削除）
- `let selectedGrade = get(taskGradesByWorkBookTypeStore).get(...) ?? TaskGrade.Q10`
- `$effect()` ブロック全体（ストアとの同期）
- `taskGradesByWorkBookTypeStore.updateTaskGrade(...)` の呼び出し行

- [x] **Step 2: Props インターフェースを更新**

```typescript
interface Props {
  workbooks: WorkbooksList;
  workbookGradeModes: Map<number, TaskGrade>;
  taskResultsWithWorkBookId: Map<number, TaskResults>;
  userId: string;
  role: Roles;
  currentGrade: TaskGrade;
  onGradeChange: (grade: TaskGrade) => void;
}

let {
  workbooks,
  workbookGradeModes,
  taskResultsWithWorkBookId,
  userId,
  role,
  currentGrade,
  onGradeChange,
}: Props = $props();
```

- [x] **Step 3: `filterByGradeMode` をコールバック委譲に変更**

```typescript
function filterByGradeMode(grade: TaskGrade) {
  onGradeChange(grade);
}
```

- [x] **Step 4: `$derived` のグレードフィルタを `splitWorkbooksByReplenishment` に置き換え**

```typescript
import { splitWorkbooksByReplenishment, ... } from '$features/workbooks/utils/workbooks';

// 変更前
let mainWorkbooks: WorkbooksList = $derived(
  workbooks.filter((workbook) => getGradeMode(workbook.id, workbookGradeModes) === selectedGrade && !workbook.isReplenished),
);
let replenishedWorkbooks: WorkbooksList = $derived(
  workbooks.filter((workbook) => getGradeMode(workbook.id, workbookGradeModes) === selectedGrade && workbook.isReplenished),
);

// 変更後（サーバー側でグレードフィルタ済み）
let { main: mainWorkbooks, replenished: replenishedWorkbooks } = $derived(
  splitWorkbooksByReplenishment(workbooks),
);
```

- [x] **Step 5: ButtonGroup のアクティブ判定を `currentGrade` に変更**

```svelte
class={currentGrade === grade ? 'text-primary-700 dark:text-primary-500!' : 'text-gray-900'}
```

- [x] **Step 6: 型チェック・ユニットテスト**

```bash
pnpm check
pnpm test:unit
```

- [x] **Step 7: コミット**

```bash
git add src/features/workbooks/components/list/CurriculumWorkBookList.svelte
git commit -m "refactor(workbooks/components): CurriculumWorkBookList uses grade prop+callback, removes store"
```
