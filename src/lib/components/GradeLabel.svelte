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
  let gradeStyle = $derived(getGradeStyle(taskGrade));

  function getGradeStyle(taskGrade: TaskGrade | string) {
    if (taskGrade === TaskGrade.D6) {
      return {
        classes:
          'shadow-md shadow-inner shadow-amber-900/80 ring-2 ring-amber-300/50 font-bold drop-shadow relative overflow-hidden rounded-md',
        style:
          'background-image: linear-gradient(to bottom right, var(--color-atcoder-D6), rgb(120, 113, 108), rgb(217, 119, 6));',
        textColor: 'text-white',
      };
    }

    return {
      classes: 'rounded-md',
      style: `background-color: ${getTaskGradeColor(taskGrade)};`,
      textColor: toChangeTextColorIfNeeds(getTaskGradeLabel(taskGrade)),
    };
  }
</script>

<div class="rounded-lg border-2 {toChangeBorderColorIfNeeds(grade)} shadow-md">
  <div
    class="p-{defaultPadding} w-{reducedWidth} xs:w-{defaultWidth} text-sm xs:text-{defaultTextSize} text-center {gradeStyle.classes} {gradeStyle.textColor}"
    style={gradeStyle.style}
  >
    {#if taskGrade !== TaskGrade.PENDING}
      {grade}
    {:else}
      −
    {/if}
  </div>
</div>
