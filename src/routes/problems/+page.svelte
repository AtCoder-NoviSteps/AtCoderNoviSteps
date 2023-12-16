<script lang="ts">
  import { ButtonGroup, Button, Tabs, TabItem } from 'flowbite-svelte';

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

      <!-- TODO: コンポーネントとして切り出す -->
      <!-- TODO: ボタンの並び順を決める -->
      <!-- FIXME: 冗長な記述をリファクタリング -->
      <ButtonGroup class="m-4 contents-center">
        <Button outline color="primary">ABC</Button>
        <Button outline color="primary">APG4b</Button>
        <Button outline color="primary">ABS</Button>
        <Button outline color="primary">PAST</Button>
        <Button outline color="primary">Tessoku Book</Button>
        <Button outline color="primary">Math and Algorithm</Button>
        <Button outline color="primary">Typical90</Button>
        <Button outline color="primary">EDPC</Button>
        <Button outline color="primary">TDPC</Button>
        <Button outline color="primary">ACL Practice</Button>
        <Button outline color="primary">JOI</Button>
      </ButtonGroup>

      <!-- TODO: 条件に一致する問題をフィルタリングする -->
      <!-- TODO: 該当する問題をテーブル形式で表示する -->
    </TabItem>

    <TabItem>
      <span slot="title" class="text-lg">Tags</span>
      <div class="m-4">Comming Soon.</div>
    </TabItem>
  </Tabs>
</div>
