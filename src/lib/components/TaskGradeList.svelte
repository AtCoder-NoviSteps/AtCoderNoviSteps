<script lang="ts">
  import TaskList from '$lib/components/TaskList.svelte';

  import type { TaskResults, TaskResult } from '$lib/types/task';
  import { TaskGrade, taskGradeValues } from '$lib/types/task';

  interface Props {
    taskResults: TaskResults;
    isLoggedIn: boolean;
  }

  let { taskResults, isLoggedIn }: Props = $props();

  // TODO: 共通する内容はutilsに移動させる。
  const taskResultsForEachGrade = $derived(
    new Map(
      taskGradeValues.map((grade): [TaskGrade, TaskResults] => [
        grade,
        taskResults.filter((taskResult: TaskResult) => taskResult.grade === grade),
      ]),
    ),
  );

  const countTasks = (taskGrade: TaskGrade) => {
    return taskResultsForEachGrade.get(taskGrade)?.length ?? 0;
  };
</script>

{#each taskGradeValues as taskGrade (taskGrade)}
  <!-- HACK: Svelteでcontinueに相当する構文は確認できず(2024年1月時点)。 -->
  {#if countTasks(taskGrade) && taskGrade !== TaskGrade.PENDING}
    <TaskList
      grade={taskGrade}
      taskResults={taskResultsForEachGrade.get(taskGrade)!}
      {isLoggedIn}
    />
  {/if}
{/each}
