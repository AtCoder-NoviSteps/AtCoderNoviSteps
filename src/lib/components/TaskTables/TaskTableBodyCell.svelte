<script lang="ts">
  import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';

  import type { TaskResult } from '$lib/types/task';

  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import UpdatingDropdown from '$lib/components/SubmissionStatus/UpdatingDropdown.svelte';

  import { getTaskUrl, removeTaskIndexFromTitle } from '$lib/utils/task';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
    onupdate?: (updatedTask: TaskResult) => void; // Ensure to update task result in parent component.
  }

  let { taskResult, isLoggedIn, onupdate = () => {} }: Props = $props();

  let updatingDropdown: UpdatingDropdown;
</script>

<div class="flex items-center w-full space-x-1 text-left text-sm sm:text-md">
  {@render taskGradeLabel(taskResult)}

  <div class="flex justify-between w-full min-w-0">
    {@render taskTitleAndExternalLink(taskResult)}
    {@render submissionUpdaterAndLinksOfTaskDetailPage(taskResult)}
  </div>
</div>

{#snippet taskGradeLabel(taskResult: TaskResult)}
  <div class="flex-shrink-0">
    <GradeLabel
      taskGrade={taskResult.grade}
      defaultPadding={0.25}
      defaultWidth={6}
      reducedWidth={6}
    />
  </div>
{/snippet}

{#snippet taskTitleAndExternalLink(taskResult: TaskResult)}
  <div class="max-w-[calc(100%-2rem)] truncate">
    <ExternalLinkWrapper
      url={getTaskUrl(taskResult.contest_id, taskResult.task_id)}
      description={removeTaskIndexFromTitle(taskResult.title, taskResult.task_table_index)}
      textSize="xs:text-md"
      textColorInDarkMode="dark:text-gray-300"
      iconSize={0}
    />
  </div>
{/snippet}

<!-- See: -->
<!-- https://svelte-5-ui-lib.codewithshin.com/components/dropdown -->
{#snippet submissionUpdaterAndLinksOfTaskDetailPage(selectedTaskResult: TaskResult)}
  <div class="flex items-start justify-center">
    <button
      type="button"
      class="flex-shrink-0 w-6 ml-auto"
      onclick={() => updatingDropdown.toggle()}
      aria-label="Update submission for {selectedTaskResult.title}"
    >
      <EllipsisVertical class="w-4 h-4 mx-auto" />
    </button>

    <UpdatingDropdown bind:this={updatingDropdown} {taskResult} {isLoggedIn} {onupdate} />
  </div>
{/snippet}
