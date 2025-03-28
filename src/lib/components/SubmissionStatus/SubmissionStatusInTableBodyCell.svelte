<script lang="ts">
  import { TableBodyCell } from 'svelte-5-ui-lib';

  import type { TaskResult } from '$lib/types/task';

  import SubmissionStatusImage from '$lib/components/SubmissionStatus/SubmissionStatusImage.svelte';
  import UpdatingDropdown from '$lib/components/SubmissionStatus/UpdatingDropdown.svelte';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
    onupdate?: (updatedTask: TaskResult) => void; // Ensure to update task result in parent component.
  }

  let { taskResult, isLoggedIn, onupdate = () => {} }: Props = $props();

  let updatingDropdown: UpdatingDropdown;
</script>

<TableBodyCell
  class="items-center justify-center w-20 px-0 pt-4 sm:pt-4 pb-0 sm:pb-1"
  onclick={() => updatingDropdown.toggle()}
>
  <div class="flex items-center justify-center min-w-[80px] max-w-[80px]">
    <SubmissionStatusImage {taskResult} {isLoggedIn} />
  </div>
</TableBodyCell>

<UpdatingDropdown bind:this={updatingDropdown} {taskResult} {isLoggedIn} {onupdate} />
