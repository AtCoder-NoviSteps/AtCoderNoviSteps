<script lang="ts">
  import { Button } from 'flowbite-svelte';

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

  // PENDING (unclassified) is admin-only and must not appear on the public page.
  // Further filtered to availableCategories (server-side: only categories with at least one workbook).
  let AVAILABLE_CATEGORIES = $derived(
    Object.values(SolutionCategory).filter(
      (category) => category !== SolutionCategory.PENDING && availableCategories.includes(category),
    ),
  );

  let readableCount = $derived(countReadableWorkbooks(workbooks, userId));
</script>

<div class="mb-6 flex flex-wrap gap-1">
  {#each AVAILABLE_CATEGORIES as category}
    <Button
      onclick={() => onCategoryChange(category)}
      color="alternative"
      class={`rounded-lg dark:text-white ${currentCategory === category ? 'text-primary-700 dark:text-primary-500!' : ''}`}
    >
      {SOLUTION_LABELS[category]}
    </Button>
  {/each}
</div>

{#if readableCount}
  <SolutionTable {workbooks} {userId} {role} taskResults={taskResultsWithWorkBookId} />
{:else}
  <EmptyWorkbookList />
{/if}
