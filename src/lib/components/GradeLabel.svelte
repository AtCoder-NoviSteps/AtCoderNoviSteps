<script lang="ts">
  import { getTaskGradeColor, getTaskGradeLabel, toWhiteTextIfNeeds } from '$lib/utils/task';
  import { TaskGrade } from '$lib/types/task';

  export let taskGrade: TaskGrade | string;

  $: grade = getTaskGradeLabel(taskGrade);
  $: gradeColor = getTaskGradeColor(taskGrade);
</script>

<div class="rounded-lg border-2 border-white">
  <div class="p-1 w-10 text-center rounded-md {toWhiteTextIfNeeds(grade)} {gradeColor}">
    {#if taskGrade !== TaskGrade.PENDING}
      {grade}
    {:else}
      {'??'}
    {/if}
  </div>
</div>
