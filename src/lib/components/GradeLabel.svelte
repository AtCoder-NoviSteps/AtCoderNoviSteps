<script lang="ts">
  import { TaskGrade } from '$lib/types/task';
  import { getTaskGradeColor, getTaskGradeLabel, toWhiteTextIfNeeds } from '$lib/utils/task';

  interface Props {
    taskGrade: TaskGrade | string;
    defaultPadding?: number;
    defaultWidth?: number;
    reducedWidth?: number;
  }

  let { taskGrade, defaultPadding = 1, defaultWidth = 10, reducedWidth = 8 }: Props = $props();

  let grade = $derived(getTaskGradeLabel(taskGrade));
  let gradeColor = $derived(getTaskGradeColor(taskGrade));
</script>

<div class="rounded-lg border-2 border-white">
  <div
    class="p-{defaultPadding} w-{reducedWidth} xs:w-{defaultWidth} text-sm xs:text-md text-center rounded-md {toWhiteTextIfNeeds(
      grade,
    )} {gradeColor}"
  >
    {#if taskGrade !== TaskGrade.PENDING}
      {grade}
    {:else}
      {'??'}
    {/if}
  </div>
</div>
