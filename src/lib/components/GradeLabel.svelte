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

  function addGradientIfNeeds(taskGrade: TaskGrade | string) {
    if (taskGrade === TaskGrade.D6) {
      const bronze =
        'bg-gradient-to-br from-atcoder-D6 via-stone-600 to-amber-600 shadow-inner shadow shadow-amber-900/80 ring-2 ring-amber-300/50 text-amber-50 font-bold drop-shadow relative overflow-hidden';
      return bronze;
    }
    return '';
  }

  let gradient = $derived(addGradientIfNeeds(taskGrade));
</script>

<div class="rounded-lg border-2 {toChangeBorderColorIfNeeds(grade)} {gradient ? 'shadow-md' : ''}">
  <div
    class="p-{defaultPadding} w-{reducedWidth} xs:w-{defaultWidth} text-sm xs:text-{defaultTextSize} text-center rounded-md
    {gradient || toChangeTextColorIfNeeds(grade) + ' ' + gradeColor}"
  >
    {#if taskGrade !== TaskGrade.PENDING}
      {grade}
    {:else}
      −
    {/if}
  </div>
</div>
