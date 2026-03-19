<script lang="ts">
  import { TableBodyCell } from 'flowbite-svelte';

  import type { TaskResults } from '$lib/types/task';
  import type { WorkBookTasksBase } from '$features/workbooks/types/workbook';

  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';
  import AcceptedCounter from '$features/workbooks/components/list/AcceptedCounter.svelte';

  interface Props {
    workBookTasks: WorkBookTasksBase;
    taskResults: TaskResults;
  }

  let { workBookTasks, taskResults }: Props = $props();
</script>

<TableBodyCell class="min-w-[240px] max-w-[1440px] px-0">
  <ThermometerProgressBar {workBookTasks} {taskResults} width="w-full" />
</TableBodyCell>

<TableBodyCell class="justify-center w-24 px-1">
  <div class="min-w-[48px] max-w-[96px]">
    <AcceptedCounter {workBookTasks} {taskResults} />
  </div>
</TableBodyCell>
