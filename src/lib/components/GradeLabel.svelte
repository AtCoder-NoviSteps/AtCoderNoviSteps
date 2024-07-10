<script lang="ts">
  import { getTaskGradeColor, getTaskGradeLabel, toWhiteTextIfNeeds } from '$lib/utils/task';
  import { TaskGrade } from '$lib/types/task';

  export let taskGrade: TaskGrade;

  $: grade = getTaskGradeLabel(taskGrade);
  $: gradeColor = getTaskGradeColor(taskGrade);
</script>

<div class="p-1 w-10 text-center rounded-lg {toWhiteTextIfNeeds(grade)} {gradeColor}">
  {#if taskGrade !== TaskGrade.PENDING}
    {grade}
  {:else}
    {'??'}
  {/if}
</div>
