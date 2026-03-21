# Phase 5: `SolutionWorkBookList.svelte` 新規作成

**レイヤー:** `src/features/workbooks/components/list/` | **リスク:** 低-中

`CurriculumWorkBookList.svelte` と同じ構造で解法別タブ用コンポーネントを作成する。カテゴリ選択 ButtonGroup を持ち、選択状態は `currentCategory` prop で受け取り、変更は `onCategoryChange` コールバックで親に委譲する。

**設計方針:**

- `workbookGradeModes` は `SolutionTable` では不使用（`workbookGradeModes: _` で破棄している）。`SolutionWorkBookList.Props` にも含めない
- `SolutionTable` の props 型を `WorkbookTableProps` から `SolutionTableProps`（`workbookGradeModes` を除いた型）に変更する
- `availableCategories` prop を受け取り、問題集が存在するカテゴリのみボタンを表示する
- `SolutionTableProps` は `workbook.ts` に定義する

> **注意:** `SolutionTable` の prop 名は `taskResults`（`WorkbookTableProps` の命名）。`CurriculumTable` の `taskResultsWithWorkBookId` とは異なる。

---

## Task 5-A: `SolutionTableProps` 型を追加

**Files:**

- Modify: `src/features/workbooks/types/workbook.ts`

- [x] **Step 1: `WorkbookTableProps` の直後に追加**

```typescript
// Imported by SolutionTable — excludes workbookGradeModes which is unused in the solution tab.
export type SolutionTableProps = Omit<WorkbookTableProps, 'workbookGradeModes'>;
```

- [x] **Step 2: 型チェック**

```bash
pnpm check
```

- [x] **Step 3: コミット**

```bash
git add src/features/workbooks/types/workbook.ts
git commit -m "feat(workbooks/types): Add SolutionTableProps excluding workbookGradeModes"
```

---

## Task 5-B: `SolutionTable.svelte` の props 型を更新

**Files:**

- Modify: `src/features/workbooks/components/list/SolutionTable.svelte`

- [x] **Step 1: `WorkbookTableProps` → `SolutionTableProps` に変更**

```svelte
<script lang="ts">
  import type { SolutionTableProps } from '$features/workbooks/types/workbook';
  // ...

  let { workbooks, userId, role, taskResults }: SolutionTableProps = $props();
</script>
```

`workbookGradeModes: _` の行を削除する。

- [x] **Step 2: 型チェック**

```bash
pnpm check
```

- [x] **Step 3: コミット**

```bash
git add src/features/workbooks/components/list/SolutionTable.svelte
git commit -m "refactor(workbooks/components): SolutionTable uses SolutionTableProps, removes unused workbookGradeModes"
```

---

## Task 5-C: `SolutionWorkBookList.svelte` を新規作成

**Files:**

- Create: `src/features/workbooks/components/list/SolutionWorkBookList.svelte`

- [x] **Step 1: コンポーネントを作成**

```svelte
<script lang="ts">
  import { ButtonGroup, Button } from 'flowbite-svelte';

  import type { Roles } from '$lib/types/user';
  import type { TaskResults } from '$lib/types/task';
  import type { WorkbooksList } from '$features/workbooks/types/workbook';
  import { SolutionCategory, SOLUTION_LABELS } from '$features/workbooks/types/workbook_placement';

  import { countReadableWorkbooks } from '$features/workbooks/utils/workbooks';

  import SolutionTable from '$features/workbooks/components/list/SolutionTable.svelte';
  import EmptyWorkbookList from '$features/workbooks/components/list/EmptyWorkbookList.svelte';

  interface Props {
    workbooks: WorkbooksList;
    taskResultsWithWorkBookId: Map<number, TaskResults>;
    userId: string;
    role: Roles;
    availableCategories: SolutionCategory[];
    currentCategory: SolutionCategory;
    onCategoryChange: (category: SolutionCategory) => void;
  }

  let {
    workbooks,
    taskResultsWithWorkBookId,
    userId,
    role,
    availableCategories,
    currentCategory,
    onCategoryChange,
  }: Props = $props();

  // PENDING（未分類）は管理者専用のため公開ページには表示しない。
  // さらに availableCategories（サーバーサイドで問題集が存在するカテゴリのみ）に絞り込む。
  const AVAILABLE_CATEGORIES = Object.values(SolutionCategory).filter(
    (category) => category !== SolutionCategory.PENDING && availableCategories.includes(category),
  );

  let readableCount = $derived(countReadableWorkbooks(workbooks, userId));
</script>

<div class="mb-6">
  <ButtonGroup>
    {#each AVAILABLE_CATEGORIES as category}
      <Button
        onclick={() => onCategoryChange(category)}
        class={currentCategory === category
          ? 'text-primary-700 dark:text-primary-500!'
          : 'text-gray-900'}
      >
        {SOLUTION_LABELS[category]}
      </Button>
    {/each}
  </ButtonGroup>
</div>

{#if readableCount}
  <SolutionTable {workbooks} {userId} {role} taskResults={taskResultsWithWorkBookId} />
{:else}
  <EmptyWorkbookList />
{/if}
```

- [x] **Step 2: 型チェック**

```bash
pnpm check
```

- [x] **Step 3: コミット**

```bash
git add src/features/workbooks/components/list/SolutionWorkBookList.svelte
git commit -m "feat(workbooks/components): Add SolutionWorkBookList with category ButtonGroup and availableCategories filter"
```
