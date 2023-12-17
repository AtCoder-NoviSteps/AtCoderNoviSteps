<script lang="ts">
  import { ButtonGroup, Button, Tabs, TabItem } from 'flowbite-svelte';

  import type { TaskResults, TaskResult } from '$lib/types/task';
  import TaskList from '$lib/components/TaskList.svelte';
  import TaskTable from '$lib/components/TaskTable.svelte';
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
<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">Problems</h1>

  <!-- See: -->
  <!-- https://flowbite-svelte.com/docs/components/tabs -->
  <Tabs style="underline" contentClass="bg-white">
    <TabItem>
      <span slot="title" class="text-lg">Latest</span>
      <div class="m-4">Comming Soon.</div>
    </TabItem>

    <TabItem open>
      <span slot="title" class="text-lg">Grade</span>

      {#each taskGradeValues as taskGrade}
        <!-- TODO: Pendingは、Adminのみ表示 -->
        {#if taskResultsForEachGrade.get(taskGrade).length > 0}
          <TaskList
            grade={getTaskGradeLabel(taskGrade)}
            gradeColor={getTaskGradeColor(taskGrade)}
            taskResults={taskResultsForEachGrade.get(taskGrade)}
          />
        {/if}
      {/each}
    </TabItem>

    <!-- TODO: コンテスト種類をトグルボタンで切り替えられるようにする -->
    <TabItem>
      <span slot="title" class="text-lg">Table</span>

      <TaskTable {taskResults} />
    </TabItem>

    <TabItem>
      <span slot="title" class="text-lg">Tags</span>
      <div class="m-4">Comming Soon.</div>
    </TabItem>
  </Tabs>
</div>
