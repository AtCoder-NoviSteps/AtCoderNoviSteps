<script lang="ts">
  import { Img } from 'flowbite-svelte';

  import { areAllTasksAccepted } from '$lib/utils/task';
  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { TaskResults } from '$lib/types/task';

  export let taskResults: TaskResults;
  export let allTasks: TaskResults | WorkBookTaskBase[];
</script>

{#if areAllTasksAccepted(taskResults, allTasks)}
  <Img src="../../completed.png" alt="completed workbook" class="h-10 w-12" />
{/if}
