<script lang="ts">
  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { TaskResults } from '$lib/types/task';
  import { countAcceptedTasks, countAllTasks } from '$lib/utils/task';

  interface Props {
    workBookTasks?: WorkBookTaskBase[];
    taskResults: TaskResults | [];
  }

  let { workBookTasks = [], taskResults }: Props = $props();

  let acceptedCount: number = $state(0);
  let allTaskCount: number = $state(0);
  let acceptedRatioPercent: number = $state(0);

  $effect(() => {
    acceptedCount = countAcceptedTasks(taskResults);
    allTaskCount = countAllTasks(workBookTasks) || countAllTasks(taskResults);
    acceptedRatioPercent = allTaskCount ? (acceptedCount / allTaskCount) * 100 : 0;
  });
</script>

<!-- FIXME: 横幅を微調整する -->
<!-- See: -->
<!-- https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed -->
<div class="text-xs xs:text-sm w-max-[72px] w-max-[96px] text-center">
  <div>
    {acceptedCount} / {allTaskCount}
  </div>
  <div>
    {`(${acceptedRatioPercent.toFixed(1)}%)`}
  </div>
</div>
