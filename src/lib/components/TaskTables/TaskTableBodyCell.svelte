<script lang="ts">
  import type { TaskResult } from '$lib/types/task';

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import IconForUpdating from '$lib/components/SubmissionStatus/IconForUpdating.svelte';
  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';

  import { getTaskUrl, removeTaskIndexFromTitle } from '$lib/utils/task';

  export let taskResult: TaskResult;
  export let isLoggedIn: boolean;
  export let updatingModal: UpdatingModal;
</script>

<!-- Task title and an external link -->
<div class="text-left text-lg">
  <ExternalLinkWrapper
    url={getTaskUrl(taskResult.contest_id, taskResult.task_id)}
    description={removeTaskIndexFromTitle(taskResult.title, taskResult.task_table_index)}
    textSize="xs:text-md"
    textColorInDarkMode="dark:text-gray-300"
    textOverflow="min-w-[60px] max-w-[132px]"
    iconSize={0}
  />
</div>

<!-- Grade -->
<div class="flex items-center justify-center py-2">
  <GradeLabel taskGrade={taskResult.grade} defaultPadding={0.5} defaultWidth={8} />
</div>

<!-- Submission updater and links of task detail page -->
<div class="flex items-center justify-between">
  <button
    type="button"
    class="flex-1 text-center"
    on:click={() => updatingModal.openModal(taskResult)}
    aria-label="Update submission"
  >
    <IconForUpdating {isLoggedIn} />
  </button>

  <!-- TODO: Add link of detailed page. -->
  <div class="flex-1 text-center text-sm dark:text-gray-300">
    {'詳細'}
  </div>
</div>
