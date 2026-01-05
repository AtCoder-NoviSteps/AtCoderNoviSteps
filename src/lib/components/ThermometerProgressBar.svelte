<script lang="ts">
  import { Tooltip } from 'flowbite-svelte';

  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { TaskResult, TaskResults } from '$lib/types/task';
  import type { SubmissionRatios, SubmissionCounts } from '$lib/types/submission';

  import { submission_statuses } from '$lib/services/submission_status';

  import { TOOLTIP_CLASS_BASE } from '$lib/constants/tailwind-helper';

  interface Props {
    workBookTasks?: WorkBookTaskBase[];
    taskResults: TaskResults;
    width?: string;
  }

  let { workBookTasks = [], taskResults, width = 'w-7/12 md:w-8/12 lg:w-9/12' }: Props = $props();

  let submissionRatios: SubmissionRatios = $state([]);
  let submissionCounts: SubmissionCounts = $state([]);
  let progressBarId = `progress-bar-${Math.floor(Math.random() * 10000)}`;

  const filteredStatuses = submission_statuses.filter((status) => status.status_name !== 'ns');

  const getRatioPercent = (taskResults: TaskResults, statusName: string) => {
    const filteredTaskCount = getTaskCount(taskResults, statusName);
    const allTaskCount = getAllTaskCount();
    const ratioPercent = allTaskCount ? (filteredTaskCount / allTaskCount) * 100 : 0;

    return ratioPercent;
  };

  const getTaskCount = (taskResults: TaskResults, statusName: string) => {
    return taskResults.filter((taskResult: TaskResult) => taskResult.status_name === statusName)
      .length;
  };

  const getAllTaskCount = () => {
    return workBookTasks.length || taskResults.length || 0;
  };

  const baseAttributes =
    'shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center';

  // TODO: ユーザの設定に応じて、ACかどうかの判定を変更できるようにする
  $effect(() => {
    submissionRatios = filteredStatuses.map((status) => {
      const name = status.status_name;
      const ratioPercent = getRatioPercent(taskResults, name);

      return {
        name: name,
        ratioPercent: ratioPercent,
        color: status.background_color,
      };
    });
  });
  $effect(() => {
    submissionCounts = filteredStatuses.map((status) => {
      const name = status.status_name;
      const taskCount = getTaskCount(taskResults, name);
      const ratioPercent = getRatioPercent(taskResults, name);

      return {
        name: status.label_name,
        count: taskCount,
        ratioPercent: ratioPercent,
      };
    });
  });
</script>

<!-- HACK: svelte-5-ui-lib にある Progressbar では 回答状況に合わせた内訳を表示できないので、HTML + tailwindcss で実装 -->
<!-- See: -->
<!-- https://blog.canopas.com/designing-stunning-progress-bars-made-easy-with-tailwind-css-ae620ba7b4be -->
<!-- https://www.creative-tim.com/learning-lab/tailwind-starter-kit/documentation/css/progressbars -->
<div class="{width} rounded-full border border-gray-200 p-1">
  <div class="rounded-full h-6">
    <span id={progressBarId}>
      <div class="overflow-hidden h-6 flex rounded-full bg-white dark:bg-gray-800">
        {#each submissionRatios as submissionRatio}
          <div
            style="width: {submissionRatio.ratioPercent}%"
            class={`${baseAttributes} ${submissionRatio.color}`}
          ></div>
        {/each}
      </div>
    </span>
  </div>
</div>

<Tooltip
  type="auto"
  triggeredBy={`#${progressBarId}`}
  placement="top-start"
  class={`max-w-[200px] ${TOOLTIP_CLASS_BASE}`}
>
  {#each submissionCounts as submissionCount}
    <div class="flex">
      <span class="w-14">{submissionCount.name}</span>
      <span class="w-2">: </span>
      <span>{submissionCount.count} ({submissionCount.ratioPercent.toFixed(1)}%)</span>
    </div>
  {/each}
</Tooltip>
