<script lang="ts">
  import { TableBodyCell } from 'flowbite-svelte';

  import type { TaskResults } from '$lib/types/task';
  import type { WorkBookTaskBase } from '$features/workbooks/types/workbook';

  import CompletedTasks from '$lib/components/Trophies/CompletedTasks.svelte';

  interface Props {
    workBookTasks: WorkBookTaskBase[];
    taskResults: TaskResults;
  }

  let { workBookTasks, taskResults }: Props = $props();
</script>

<TableBodyCell class="justify-center items-center min-w-[54px] max-w-[54px] px-0">
  <div class="flex justify-center items-center">
    <CompletedTasks {taskResults} allTasks={workBookTasks} />
  </div>
</TableBodyCell>
