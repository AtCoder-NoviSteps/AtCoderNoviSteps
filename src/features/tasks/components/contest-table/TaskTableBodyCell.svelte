<script lang="ts">
  import type { TaskResult } from '#lib/types/task.js';
  import type { VoteStatisticsMap } from '#features/votes/types/vote_result.js';

  import VotableGrade from '#features/votes/components/VotableGrade.svelte';
  import ExternalLinkWrapper from '#lib/components/ExternalLinkWrapper.svelte';
  import UpdatingDropdown from '#lib/components/SubmissionStatus/UpdatingDropdown.svelte';

  import {
    getTaskUrl,
    removeTaskIndexFromTitle,
    buildTitleWithTaskIndex,
  } from '#lib/utils/task.js';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
    isAtCoderVerified: boolean;
    isShownTaskIndex: boolean;
    voteResults: VoteStatisticsMap;
    showNeutralBadge?: boolean;
    onupdate?: (updatedTask: TaskResult) => void; // Ensure to update task result in parent component.
  }

  let {
    taskResult,
    isLoggedIn,
    isAtCoderVerified,
    isShownTaskIndex,
    voteResults,
    showNeutralBadge = true,
    onupdate = () => {},
  }: Props = $props();

  let estimatedGrade = $derived(voteResults.get(taskResult.task_id)?.grade);
  let displayTitle = $derived(
    isShownTaskIndex
      ? buildTitleWithTaskIndex(taskResult.title, taskResult.task_table_index)
      : removeTaskIndexFromTitle(taskResult.title, taskResult.task_table_index),
  );
</script>

<div
  class="flex items-center w-full pl-0 lg:pl-1 space-x-1 lg:space-x-2 text-left text-sm sm:text-md"
>
  {@render taskGradeLabel(taskResult)}

  <div class="flex items-center justify-between w-full min-w-0">
    {@render taskTitleAndExternalLink(taskResult)}
    {@render submissionUpdaterAndLinksOfTaskDetailPage(taskResult)}
  </div>
</div>

{#snippet taskGradeLabel(taskResult: TaskResult)}
  <VotableGrade
    {taskResult}
    {isLoggedIn}
    {isAtCoderVerified}
    {estimatedGrade}
    {showNeutralBadge}
    defaultPadding={0.25}
    defaultWidth={6}
    reducedWidth={6}
  />
{/snippet}

{#snippet taskTitleAndExternalLink(taskResult: TaskResult)}
  <div class="max-w-[calc(100%-1rem)] truncate">
    <ExternalLinkWrapper
      url={getTaskUrl(taskResult.contest_id, taskResult.task_id)}
      description={displayTitle}
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
