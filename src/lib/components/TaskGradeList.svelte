<script lang="ts">
  import TaskList from '$lib/components/TaskList.svelte';
  import { getTaskGradeColor, getTaskGradeLabel } from '$lib/utils/task';
  import type { TaskResults, TaskResult } from '$lib/types/task';
  import { TaskGrade, taskGradeValues } from '$lib/types/task';

  export let taskResults: TaskResults;
  export let isAdmin: boolean;

  // TODO: 共通する内容はutilsに移動させる。
  let taskResultsForEachGrade = new Map();

  $: {
    taskResultsForEachGrade = new Map();
    taskGradeValues.map((grade) => {
      taskResultsForEachGrade.set(
        grade,
        taskResults.filter((taskResult: TaskResult) => taskResult.grade === grade),
      );
    });
  }

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
