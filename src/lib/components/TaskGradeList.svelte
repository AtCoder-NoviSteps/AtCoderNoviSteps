<script lang="ts">
  import TaskList from '$lib/components/TaskList.svelte';
  import { getTaskGradeColor } from '$lib/utils/task';
  import type { TaskResults, TaskResult } from '$lib/types/task';
  import { TaskGrade, taskGradeValues } from '$lib/types/task';

  export let taskResults: TaskResults;
  export let isAdmin: boolean;

  // TODO: 共通する内容はutilsに移動させる。
  let taskResultsForEachGrade = new Map();

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
  const getTaskGradeLabel = (taskGrade: TaskGrade) => {
    if (taskGrade === TaskGrade.PENDING) {
      return TaskGrade.PENDING;
    } else {
      return taskGrade.slice(1) + taskGrade.slice(0, 1);
    }
  };
</script>

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
