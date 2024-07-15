<script lang="ts">
  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { TaskResult, TaskResults } from '$lib/types/task';

  export let workBookTasks: WorkBookTaskBase[] = [];
  export let taskResults: TaskResults;

  let acceptedCount: number = 0;
  let allTaskCount: number = 0;
  let acceptedRatioPercent: number = 0;

  $: {
    const acceptedResults = taskResults.filter((taskResult: TaskResult) => taskResult.is_ac);
    acceptedCount = acceptedResults.length;
    allTaskCount = workBookTasks.length || taskResults.length;
    acceptedRatioPercent = allTaskCount ? (acceptedCount / allTaskCount) * 100 : 0;
  }
</script>

<!-- FIXME: 横幅を微調整する -->
<!-- See: -->
<!-- https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed -->
<div class="text-sm w-max-[72px] w-max-[96px] text-center">
  <div>
    {acceptedCount} / {allTaskCount}
  </div>
  <div>
    {`(${acceptedRatioPercent.toFixed(1)}%)`}
  </div>
</div>
