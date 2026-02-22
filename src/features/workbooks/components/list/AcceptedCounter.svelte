<script lang="ts">
  import type { TaskResults } from '$lib/types/task';
  import type { WorkBookTaskBase } from '$features/workbooks/types/workbook';

  import AcceptedCounter from '$lib/components/SubmissionStatus/AcceptedCounter.svelte';

  import { countAcceptedTasks, countAllTasks } from '$lib/utils/task';

  interface Props {
    workBookTasks: WorkBookTaskBase[];
    taskResults: TaskResults;
  }

  let { workBookTasks, taskResults }: Props = $props();

  const acceptedCount = $derived(countAcceptedTasks(taskResults));
  const allTaskCount = $derived(countAllTasks(workBookTasks));
</script>

<AcceptedCounter {acceptedCount} {allTaskCount} />
