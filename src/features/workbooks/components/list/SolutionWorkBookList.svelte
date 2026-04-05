<script lang="ts">
  import { Button } from 'flowbite-svelte';

  import type { Roles } from '$lib/types/user';
  import type { TaskResults } from '$lib/types/task';
  import type { WorkbooksList } from '$features/workbooks/types/workbook';
  import {
    SolutionCategory,
    type SolutionCategories,
    SOLUTION_LABELS,
    ALL_SOLUTION_CATEGORIES,
    type SelectedSolutionCategory,
  } from '$features/workbooks/types/workbook_placement';

  import { countReadableWorkbooks } from '$features/workbooks/utils/workbooks';
  import {
    groupBySolutionCategory,
    type WorkbookGroup,
  } from '$features/workbooks/utils/solution_category_group';

  import SolutionTable from '$features/workbooks/components/list/SolutionTable.svelte';
  import EmptyWorkbookList from '$features/workbooks/components/list/EmptyWorkbookList.svelte';

  interface Props {
    workbooks: WorkbooksList;
    taskResultsWithWorkBookId: Map<number, TaskResults>;
    userId: string;
    role: Roles;
    availableCategories: SolutionCategories;
    currentCategory: SelectedSolutionCategory;
    solutionCategoryMap: Map<number, SolutionCategory>;
    onCategoryChange: (category: SelectedSolutionCategory) => void;
  }

  let {
    workbooks,
    taskResultsWithWorkBookId,
    userId,
    role,
    availableCategories,
    currentCategory,
    solutionCategoryMap,
    onCategoryChange,
  }: Props = $props();

  // PENDING (unclassified) is admin-only and must not appear on the public page.
  // Further filtered to availableCategories (server-side: only categories with at least one workbook).
  let AVAILABLE_CATEGORIES = $derived(
    Object.values(SolutionCategory).filter(
      (category) => category !== SolutionCategory.PENDING && availableCategories.includes(category),
    ),
  );

  // Unified button entries: All (null) first, then individual categories.
  // Using a typed entry object avoids a separate ALL button in the template.
  type CategoryEntry = { value: SelectedSolutionCategory; label: string };

  const ALL_ENTRY: CategoryEntry = { value: ALL_SOLUTION_CATEGORIES, label: 'All' };

  let CATEGORY_ENTRIES = $derived<CategoryEntry[]>([
    ALL_ENTRY,
    ...AVAILABLE_CATEGORIES.map(
      (category): CategoryEntry => ({
        value: category,
        label: SOLUTION_LABELS[category],
      }),
    ),
  ]);

  // "全て" 選択時のグループ化。特定カテゴリ選択時は null。
  let groupedWorkbooks = $derived<WorkbookGroup[] | null>(
    currentCategory === ALL_SOLUTION_CATEGORIES
      ? groupBySolutionCategory(workbooks, solutionCategoryMap)
      : null,
  );

  let readableCount = $derived(countReadableWorkbooks(workbooks, userId));
</script>

<div class="mb-6 flex flex-wrap gap-1">
  {#each CATEGORY_ENTRIES as entry (entry.value ?? 'all')}
    <Button
      onclick={() => onCategoryChange(entry.value)}
      color="alternative"
      aria-pressed={currentCategory === entry.value}
      class={`rounded-lg dark:text-white ${currentCategory === entry.value ? 'text-primary-700 dark:text-primary-500!' : ''}`}
    >
      {entry.label}
    </Button>
  {/each}
</div>

{#if currentCategory === ALL_SOLUTION_CATEGORIES}
  <!-- Group display: render sections in SolutionCategory enum order -->
  {#if readableCount}
    {#each groupedWorkbooks ?? [] as group (group.category)}
      <div class="text-2xl pb-4 dark:text-white">{SOLUTION_LABELS[group.category]}</div>
      <SolutionTable
        workbooks={group.workbooks}
        {userId}
        {role}
        taskResults={taskResultsWithWorkBookId}
      />
    {/each}
  {:else}
    <EmptyWorkbookList />
  {/if}
{:else}
  <!-- Specific category selected: flat list display with category title -->
  {#if readableCount}
    <div class="text-2xl pb-4 dark:text-white">{SOLUTION_LABELS[currentCategory]}</div>
    <SolutionTable {workbooks} {userId} {role} taskResults={taskResultsWithWorkBookId} />
  {:else}
    <EmptyWorkbookList />
  {/if}
{/if}
