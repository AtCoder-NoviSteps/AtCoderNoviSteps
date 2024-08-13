<script lang="ts">
  import { Tooltip } from 'flowbite-svelte';

  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { TaskResult, TaskResults } from '$lib/types/task';
  import type { SubmissionRatios, SubmissionCounts } from '$lib/types/submission';
  import { submission_statuses } from '$lib/services/submission_status';

  export let workBookTasks: WorkBookTaskBase[] = [];
  export let taskResults: TaskResults;
  export let width: string = 'w-7/12 md:w-8/12 lg:w-9/12';

  let submissionRatios: SubmissionRatios = [];
  let submissionCounts: SubmissionCounts = [];
  let progressBarId = `progress-bar-${Math.floor(Math.random() * 10000)}`;

  const filteredStatuses = submission_statuses.filter((status) => status.status_name !== 'ns');

  // TODO: ユーザの設定に応じて、ACかどうかの判定を変更できるようにする
  $: submissionRatios = filteredStatuses.map((status) => {
    const name = status.status_name;
    const ratioPercent = getRatioPercent(taskResults, name);

    return {
      name: name,
      ratioPercent: ratioPercent,
      color: status.background_color,
    };
  });

  $: submissionCounts = filteredStatuses.map((status) => {
    const name = status.status_name;
    const taskCount = getTaskCount(taskResults, name);
    const ratioPercent = getRatioPercent(taskResults, name);

    return {
      name: status.label_name,
      count: taskCount,
      ratioPercent: ratioPercent,
    };
  });

  $: validRatioCount = submissionRatios.filter(
    (submissionRatio) => submissionRatio.ratioPercent > 0,
  ).length;

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

  // ダークモードの処理
  // 1. 白色の縦線を間に入れる
  const addWhiteLineAtRightIfNeeds = (ratioPercent: number) => {
    return ratioPercent > 0 ? 'dark:border-r dark:border-gray-800' : '';
  };

  // 2. 有効な回答状況のうち、最も右側の白線を非表示にする
  const hideWhiteLineIfNeeds = (index: number) => {
    return index >= validRatioCount - 1 ? 'dark:border-r-0' : '';
  };
</script>

<!-- HACK: 本来であれば、Flowbite SvelteにあるProgressbarのcolor属性で色を指定したいが、同属性の拡張方法が分からないのでFlowbiteのコンポーネントをやむなく利用 -->
<!-- See: -->
<!-- https://flowbite.com/docs/components/progress/ -->
<!-- https://flowbite-svelte.com/docs/pages/typescript -->
<!-- https://flowbite.com/docs/components/progress/ -->
<!-- https://blog.canopas.com/designing-stunning-progress-bars-made-easy-with-tailwind-css-ae620ba7b4be -->
<!-- https://www.creative-tim.com/learning-lab/tailwind-starter-kit/documentation/css/progressbars -->
<div class="{width} rounded-full border border-gray-200 p-1">
  <div class="rounded-full h-6">
    <span id={progressBarId}>
      <div class="overflow-hidden h-6 flex rounded-full bg-white dark:bg-gray-800">
        {#each submissionRatios as submissionRatio, index}
          <!-- Note: ダークモードでは、識別しやすくするため、白色の縦線を間に入れている（回答状況の種類が2種類以上） -->
          <div
            style="width: {submissionRatio.ratioPercent}%"
            class={`${baseAttributes} ${submissionRatio.color} ${addWhiteLineAtRightIfNeeds(submissionRatio.ratioPercent)} ${hideWhiteLineIfNeeds(index)}`}
          ></div>
        {/each}
      </div>
    </span>
  </div>
</div>

<Tooltip type="auto" triggeredBy={`#${progressBarId}`} placement="top-start" class="max-w-[200px]">
  {#each submissionCounts as submissionCount}
    <div class="flex">
      <span class="w-14">{submissionCount.name}</span>
      <span class="w-2">: </span>
      <span>{submissionCount.count} ({submissionCount.ratioPercent.toFixed(1)}%)</span>
    </div>
  {/each}
</Tooltip>
