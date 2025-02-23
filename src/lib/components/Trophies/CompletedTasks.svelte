<script lang="ts">
  import { Img } from 'svelte-5-ui-lib';

  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { TaskResults } from '$lib/types/task';

  import { areAllTasksAccepted } from '$lib/utils/task';

  /**
   * Props for the CompletedTasks component
   * @property {TaskResults} taskResults - The current task results
   * @property {TaskResults | WorkBookTaskBase[]} allTasks - All available tasks
   */
  interface Props {
    taskResults: TaskResults;
    allTasks: TaskResults | WorkBookTaskBase[];
  }

  let { taskResults, allTasks }: Props = $props();
</script>

{#if areAllTasksAccepted(taskResults, allTasks)}
  <Img src="../../completed.png" alt="completed workbook" imgClass="h-10 w-12" />
{/if}
