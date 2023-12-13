<script lang="ts">
  import type { TaskResults, TaskResult } from '$lib/types/task';
  import TaskList from '$lib/components/TaskList.svelte';
  import { TaskGrade, taskGradeValues } from '$lib/types/task';
  import { getTaskGradeColor } from '$lib/utils/task';

  export let data;

  let taskResults: TaskResults = data.taskResults;

  let taskResultsForEachGrade = new Map();

  taskGradeValues.map((grade) => {
    taskResultsForEachGrade.set(
      grade,
      taskResults.filter((taskResult: TaskResult) => taskResult.grade === grade),
    );
  });

  // TODO: Move to common lib.
  // Q11 → 11Q、D1 → 1D
  function getTaskGradeLabel(taskGrade: TaskGrade) {
    if (taskGrade === TaskGrade.PENDING) {
      return TaskGrade.PENDING;
    } else {
      return taskGrade.slice(1) + taskGrade.slice(0, 1);
    }
  }
</script>

<!-- TODO: Searchを追加 -->
<!-- TODO: コンテスト種類をトグルボタンで切り替えられるようにする -->
<!-- TODO: Pendingは、Adminのみ表示 -->
<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">Problems</h1>
  {#each taskGradeValues as taskGrade}
    {#if taskResultsForEachGrade.get(taskGrade).length > 0}
      <TaskList
        grade={getTaskGradeLabel(taskGrade)}
        gradeColor={getTaskGradeColor(taskGrade)}
        taskResults={taskResultsForEachGrade.get(taskGrade)}
      />
    {/if}
  {/each}
</div>
