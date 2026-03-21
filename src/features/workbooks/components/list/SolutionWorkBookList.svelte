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

  // PENDING (unclassified) is admin-only and must not appear on the public page.
  // Further filtered to availableCategories (server-side: only categories with at least one workbook).
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
