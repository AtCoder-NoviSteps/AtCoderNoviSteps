<script lang="ts">
  import type { TaskResults, TaskResult } from '$lib/types/task';
  import TaskList from '$lib/components/TaskList.svelte';
  import { TaskGrade, taskGradeValues } from '$lib/types/task';
  import { getTaskGradeColor } from '$lib/utils/task';

  export let data;

  let taskResults: TaskResults = data.taskResults;
  let isAdmin: boolean = data.isAdmin;

  let taskResultsForEachGrade = new Map();

  //console.log(taskResults)

  taskGradeValues.map((grade) => {
    taskResultsForEachGrade.set(
      grade,
      taskResults.filter((taskResult: TaskResult) => taskResult.grade === grade),
    );
  });

  const countTasks = (taskGrade: TaskGrade) => {
    return taskResultsForEachGrade.get(taskGrade).length;
  };

  const isShowTaskList = (isAdmin: boolean, taskGrade: TaskGrade): boolean => {
    if (isAdmin) {
      return true;
    }

    if (taskGrade !== TaskGrade.PENDING) {
      return true;
    }

    return false;
  };

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
<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">Problems</h1>
  {#each taskGradeValues as taskGrade}
    <!-- Pendingは、Adminのみ表示。-->
    <!-- HACK: Svelteでcontinueに相当する構文は確認できず(2024年1月時点)。 -->
    {#if countTasks(taskGrade) > 0 && isShowTaskList(isAdmin, taskGrade)}
      <TaskList
        grade={getTaskGradeLabel(taskGrade)}
        gradeColor={getTaskGradeColor(taskGrade)}
        taskResults={taskResultsForEachGrade.get(taskGrade)}
        {isAdmin}
      />
    {/if}
  {/each}
</div>
