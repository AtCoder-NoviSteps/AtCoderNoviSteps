<script lang="ts">
  import { getTaskGradeColor, getTaskGradeLabel, toWhiteTextIfNeeds } from '$lib/utils/task';
  import { TaskGrade } from '$lib/types/task';

  export let taskGrade: TaskGrade | string;
  export let defaultPadding: number = 1;
  export let defaultWidth: number = 10;

  $: grade = getTaskGradeLabel(taskGrade);
  $: gradeColor = getTaskGradeColor(taskGrade);
</script>

<div class="rounded-lg border-2 border-white">
  <div
    class="p-{defaultPadding} w-8 xs:w-{defaultWidth} text-sm xs:text-md text-center rounded-md {toWhiteTextIfNeeds(
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
