<script lang="ts">
  import type { TaskResult, TaskResults } from '$lib/types/task';

  export let taskResults: TaskResults;

  let acceptedCount: number;
  let taskResultsCount: number;
  let acceptedRatioPercent: number;

  $: {
    acceptedCount = taskResults.filter((taskResult: TaskResult) => taskResult.is_ac).length;
    taskResultsCount = taskResults.length;
    acceptedRatioPercent = (acceptedCount / taskResults.length) * 100;
  }
</script>

<!-- FIXME: 横幅を微調整する -->
<!-- See: -->
<!-- https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed -->
<div class="text-sm w-max-[72px] w-max-[96px] text-center">
  <div>
    {acceptedCount} / {taskResultsCount}
  </div>
  <div>
    {`(${acceptedRatioPercent.toFixed(1)}%)`}
  </div>
</div>
