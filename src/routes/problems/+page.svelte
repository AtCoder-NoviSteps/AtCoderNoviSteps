<script lang="ts">
  import type { TaskResults, TaskResult } from '$lib/types/task';
  import TaskList from '$lib/components/TaskList.svelte';
  import { TaskGrade } from '$lib/types/task';

  export let data;

  let taskResults: TaskResults = data.taskResults;

  // FIXME: コードの重複があるので、リファクタリング
  // HACK: Enumの変数を利用してループで処理できないか?
  let tasks_pendings = taskResults.filter(
    (taskResult: TaskResult) => taskResult.grade === TaskGrade.PENDING,
  );
  let tasks_11Q = taskResults.filter(
    (taskResult: TaskResult) => taskResult.grade === TaskGrade.Q11,
  );
  let tasks_10Q = taskResults.filter(
    (taskResult: TaskResult) => taskResult.grade === TaskGrade.Q10,
  );
  let tasks_9Q = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.Q9);
  let tasks_8Q = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.Q8);
  let tasks_7Q = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.Q7);
  let tasks_6Q = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.Q6);
  let tasks_5Q = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.Q5);
  let tasks_4Q = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.Q4);
  let tasks_3Q = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.Q3);
  let tasks_2Q = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.Q2);
  let tasks_1Q = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.Q1);
  let tasks_1D = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.D1);
  let tasks_2D = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.D2);
  let tasks_3D = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.D3);
  let tasks_4D = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.D4);
  let tasks_5D = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.D5);
  let tasks_6D = taskResults.filter((taskResult: TaskResult) => taskResult.grade === TaskGrade.D6);
</script>

<!-- TODO: Searchを追加 -->
<!-- TODO: コンテスト種類をトグルボタンで切り替えられるようにする -->
<!-- TODO: 各グレードの問題一覧を折りたたむ -->
<!-- TODO: 該当するグレードの問題がない場合の処理を追加 -->
<!-- FIXME: コードの重複があるので、リファクタリング -->
<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">Problems</h1>
  {#if tasks_pendings.length > 0}
    <!-- Adminのみ表示 -->
    <TaskList grade="Pending" taskResults={tasks_pendings} />
  {/if}
  {#if tasks_11Q.length > 0}
    <TaskList grade="11Q" taskResults={tasks_11Q} />
  {/if}
  {#if tasks_10Q.length > 0}
    <TaskList grade="10Q" taskResults={tasks_10Q} />
  {/if}
  {#if tasks_9Q.length > 0}
    <TaskList grade="9Q" taskResults={tasks_9Q} />
  {/if}
  {#if tasks_8Q.length > 0}
    <TaskList grade="8Q" taskResults={tasks_8Q} />
  {/if}
  {#if tasks_7Q.length > 0}
    <TaskList grade="7Q" taskResults={tasks_7Q} />
  {/if}
  {#if tasks_6Q.length > 0}
    <TaskList grade="6Q" taskResults={tasks_6Q} />
  {/if}
  {#if tasks_5Q.length > 0}
    <TaskList grade="5Q" taskResults={tasks_5Q} />
  {/if}
  {#if tasks_4Q.length > 0}
    <TaskList grade="4Q" taskResults={tasks_4Q} />
  {/if}
  {#if tasks_3Q.length > 0}
    <TaskList grade="3Q" taskResults={tasks_3Q} />
  {/if}
  {#if tasks_2Q.length > 0}
    <TaskList grade="2Q" taskResults={tasks_2Q} />
  {/if}
  {#if tasks_1Q.length > 0}
    <TaskList grade="1Q" taskResults={tasks_1Q} />
  {/if}
  {#if tasks_1D.length > 0}
    <TaskList grade="1D" taskResults={tasks_1D} />
  {/if}
  {#if tasks_2D.length > 0}
    <TaskList grade="2D" taskResults={tasks_2D} />
  {/if}
  {#if tasks_3D.length > 0}
    <TaskList grade="3D" taskResults={tasks_3D} />
  {/if}
  {#if tasks_4D.length > 0}
    <TaskList grade="4D" taskResults={tasks_4D} />
  {/if}
  {#if tasks_5D.length > 0}
    <TaskList grade="5D" taskResults={tasks_5D} />
  {/if}
  {#if tasks_6D.length > 0}
    <TaskList grade="6D" taskResults={tasks_6D} />
  {/if}
</div>
