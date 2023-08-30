<script lang="ts">
  import type { Tasks, Task } from '$lib/types/task';
  import TaskList from '$lib/components/TaskList.svelte';

  export let data;

  let tasks: Tasks = data.tasks;

  // FIXME: コードの重複があるので、リファクタリング
  let tasks10Kyu = tasks.filter((task: Task) => task.grade === '10Kyu');
  let tasks9Kyu = tasks.filter((task: Task) => task.grade === '9Kyu');
</script>

<!-- TODO: 他の級・段も表示できるように -->
<!-- FIXME: コードの重複があるので、リファクタリング -->
<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">Problems</h1>
  <TaskList grade="10級" tasks={tasks10Kyu} />
  <TaskList grade="9級" tasks={tasks9Kyu} />
</div>
