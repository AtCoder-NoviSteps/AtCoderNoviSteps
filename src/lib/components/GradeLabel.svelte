<script lang="ts">
  import { TaskGrade } from '$lib/types/task';
  import {
    getTaskGradeColor,
    getTaskGradeLabel,
    toChangeTextColorIfNeeds,
    toChangeBorderColorIfNeeds,
  } from '$lib/utils/task';

  interface Props {
    taskGrade: TaskGrade | string;
    defaultPadding?: number;
    defaultWidth?: number;
    reducedWidth?: number;
    defaultTextSize?: string;
  }

  let {
    taskGrade,
    defaultPadding = 1,
    defaultWidth = 10,
    reducedWidth = 8,
    defaultTextSize = 'md',
  }: Props = $props();

  let grade = $derived(getTaskGradeLabel(taskGrade));
  let gradeColor = $derived(getTaskGradeColor(taskGrade));
</script>

<div class="rounded-lg border-2 {toChangeBorderColorIfNeeds(grade)}">
  <div
    class="p-{defaultPadding} w-{reducedWidth} xs:w-{defaultWidth} text-sm xs:text-{defaultTextSize} text-center rounded-md {toChangeTextColorIfNeeds(
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
