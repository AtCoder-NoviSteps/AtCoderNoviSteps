# Phase 5: `SolutionWorkBookList.svelte` 新規作成

**レイヤー:** `src/features/workbooks/components/list/` | **リスク:** 低-中

`CurriculumWorkBookList.svelte` と同じ構造で解法別タブ用コンポーネントを作成する。カテゴリ選択 ButtonGroup を持ち、選択状態は `currentCategory` prop で受け取り、変更は `onCategoryChange` コールバックで親に委譲する。

> **注意:** `SolutionTable` の prop 名は `taskResults`（`WorkbookTableProps` の命名）。`CurriculumTable` の `taskResultsWithWorkBookId` とは異なる。

---

**Files:**

- Create: `src/features/workbooks/components/list/SolutionWorkBookList.svelte`

- [ ] **Step 1: コンポーネントを作成**

```svelte
<script lang="ts">
  import { ButtonGroup, Button } from 'flowbite-svelte';

  import type { Roles } from '$lib/types/user';
  import { TaskGrade, type TaskResults } from '$lib/types/task';
  import { SolutionCategory, SOLUTION_LABELS } from '$features/workbooks/types/workbook_placement';
  import type { WorkbooksList } from '$features/workbooks/types/workbook';

  import { countReadableWorkbooks } from '$features/workbooks/utils/workbooks';

  import SolutionTable from '$features/workbooks/components/list/SolutionTable.svelte';
  import EmptyWorkbookList from '$features/workbooks/components/list/EmptyWorkbookList.svelte';

  interface Props {
    workbooks: WorkbooksList;
    workbookGradeModes: Map<number, TaskGrade>;
    taskResultsWithWorkBookId: Map<number, TaskResults>;
    userId: string;
    role: Roles;
    currentCategory: SolutionCategory;
    onCategoryChange: (category: SolutionCategory) => void;
  }

  let {
    workbooks,
    workbookGradeModes,
    taskResultsWithWorkBookId,
    userId,
    role,
    currentCategory,
    onCategoryChange,
  }: Props = $props();

  // PENDING（未分類）は管理者専用のため公開ページには表示しない
  const AVAILABLE_CATEGORIES = Object.values(SolutionCategory).filter(
    (category) => category !== SolutionCategory.PENDING,
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
  <SolutionTable
    {workbooks}
    {workbookGradeModes}
    {userId}
    {role}
    taskResults={taskResultsWithWorkBookId}
  />
{:else}
  <EmptyWorkbookList />
{/if}
```

- [ ] **Step 2: 型チェック**

```bash
pnpm check
```

- [ ] **Step 3: コミット**

```bash
git add src/features/workbooks/components/list/SolutionWorkBookList.svelte
git commit -m "feat(workbooks/components): Add SolutionWorkBookList with category ButtonGroup"
```
