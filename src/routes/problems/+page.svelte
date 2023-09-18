<script lang="ts">
  import type { TaskResults, TaskResult } from '$lib/types/task';
  import TaskList from '$lib/components/TaskList.svelte';

  export let data;

  let taskResults: TaskResults = data.taskResults;

  // FIXME: コードの重複があるので、リファクタリング
  let tasks10Kyu = taskResults.filter((taskResult: TaskResult) => taskResult.grade === '10Kyu');
  let tasks9Kyu = taskResults.filter((taskResult: TaskResult) => taskResult.grade === '9Kyu');
</script>

<!-- TODO: Searchを追加 -->
<!-- TODO: 他の級・段も表示できるように -->
<!-- FIXME: コードの重複があるので、リファクタリング -->
<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">Problems</h1>
  <TaskList grade="10級" taskResults={tasks10Kyu} />
  <TaskList grade="9級" taskResults={tasks9Kyu} />
</div>
