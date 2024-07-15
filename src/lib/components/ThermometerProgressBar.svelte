<script lang="ts">
  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { TaskResult, TaskResults } from '$lib/types/task';
  import type { SubmissionRatios } from '$lib/types/submission';
  import { submission_statuses } from '$lib/services/submission_status';

  export let workBookTasks: WorkBookTaskBase[] = [];
  export let taskResults: TaskResults;
  // FIXME: 小さい画面でも横スクロールで見えるようにする
  export let width: string = 'w-7/12 md:w-8/12 lg:w-9/12';

  let submissionRatios: SubmissionRatios;

  // TODO: ユーザの設定に応じて、ACかどうかの判定を変更できるようにする
  $: {
    const filteredStatuses = submission_statuses.filter((status) => status.status_name !== 'ns');

    submissionRatios = filteredStatuses.map((status) => {
      const name = status.status_name;
      const ratioPercent = getRatioPercent(taskResults, name);

      return {
        name: name,
        ratioPercent: ratioPercent,
        color: status.background_color,
      };
    });
  }

  const getRatioPercent = (taskResults: TaskResults, statusName: string) => {
    const filteredTaskCount = taskResults.filter(
      (taskResult: TaskResult) => taskResult.status_name === statusName,
    ).length;
    const allTaskCount = getAllTaskCount();
    const ratioPercent = allTaskCount ? (filteredTaskCount / allTaskCount) * 100 : 0;

    return ratioPercent;
  };

  const getAllTaskCount = () => {
    return workBookTasks.length || taskResults.length || 0;
  };

  const baseAttributes =
    'shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center';
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
    <div class="overflow-hidden h-6 flex rounded-full bg-white">
      {#each submissionRatios as submissionRatio}
        <div
          style="width: {submissionRatio.ratioPercent}%"
          class={`${baseAttributes} ${submissionRatio.color}`}
        ></div>
      {/each}
    </div>
  </div>
</div>
