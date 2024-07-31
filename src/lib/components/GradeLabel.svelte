<script lang="ts">
  import { getTaskGradeColor, getTaskGradeLabel, toWhiteTextIfNeeds } from '$lib/utils/task';
  import { TaskGrade } from '$lib/types/task';

  export let taskGrade: TaskGrade | string;

  $: grade = getTaskGradeLabel(taskGrade);
  $: gradeColor = getTaskGradeColor(taskGrade);
</script>

<div class="rounded-lg border-2 border-white">
  <div
    class="p-0.5 xs:p-1 w-8 xs:w-10 text-sm xs:text-md text-center rounded-lg {toWhiteTextIfNeeds(
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
