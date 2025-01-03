<script lang="ts">
  import type { TaskResult } from '$lib/types/task';

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import IconForUpdating from '$lib/components/SubmissionStatus/IconForUpdating.svelte';
  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';

  import { getTaskUrl } from '$lib/utils/task';

  export let taskResult: TaskResult;
  export let isLoggedIn: boolean;
  export let updatingModal: UpdatingModal;
</script>

<!-- Task title and an external link -->
<div class="text-left text-md sm:text-lg">
  <ExternalLinkWrapper
    url={getTaskUrl(taskResult.contest_id, taskResult.task_id)}
    description={taskResult.title}
    textSize="xs:text-md"
    textColorInDarkMode="dark:text-gray-300"
    textOverflow="min-w-[60px] max-w-[120px]"
    iconSize={0}
  />
</div>

<div class="flex items-center justify-between py-1">
  <!-- Task grade -->
  <GradeLabel taskGrade={taskResult.grade} defaultPadding={0.25} defaultWidth={8} />

  <!-- Submission updater and links of task detail page -->
  <button
    type="button"
    class="mx-2 w-8 text-center"
    on:click={() => updatingModal.openModal(taskResult)}
    aria-label="Update submission for {taskResult.title}"
  >
    <IconForUpdating {isLoggedIn} />
  </button>

  <!-- TODO: Add link of detailed page. -->
  <div class="flex-1 text-center text-sm dark:text-gray-300 max-w-[32px]">
    {'詳細'}
  </div>
</div>
