<script lang="ts">
  import type { TaskResult } from '$lib/types/task';

  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import UpdatingDropdown from '$lib/components/SubmissionStatus/UpdatingDropdown.svelte';

  import { getTaskUrl, removeTaskIndexFromTitle } from '$lib/utils/task';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
    isShownTaskIndex: boolean;
    onupdate?: (updatedTask: TaskResult) => void; // Ensure to update task result in parent component.
  }

  let { taskResult, isLoggedIn, isShownTaskIndex, onupdate = () => {} }: Props = $props();
</script>

<div
  class="flex items-center w-full pl-0 lg:pl-1 space-x-1 lg:space-x-2 text-left text-sm sm:text-md"
>
  {@render taskGradeLabel(taskResult)}

  <div class="flex items-center justify-between w-full min-w-0">
    {@render taskTitleAndExternalLink(taskResult, isShownTaskIndex)}
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

{#snippet taskTitleAndExternalLink(taskResult: TaskResult, isShownTaskIndex: boolean)}
  <div class="max-w-[calc(100%-1rem)] truncate">
    <ExternalLinkWrapper
      url={getTaskUrl(taskResult.contest_id, taskResult.task_id)}
      description={isShownTaskIndex
        ? taskResult.title
        : removeTaskIndexFromTitle(taskResult.title, taskResult.task_table_index)}
      textSize="xs:text-md"
      textColorInDarkMode="dark:text-gray-300"
      iconSize={0}
      useInlineFlex={false}
    />
  </div>
{/snippet}

{#snippet submissionUpdaterAndLinksOfTaskDetailPage(selectedTaskResult: TaskResult)}
  <UpdatingDropdown taskResult={selectedTaskResult} {isLoggedIn} {onupdate} />
{/snippet}
