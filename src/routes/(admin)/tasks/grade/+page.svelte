<script lang="ts">
  import { TaskGrade } from '$lib/types/task';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TaskGradeTable from './_components/TaskGradeTable.svelte';

  let { data } = $props();

  const pendingTasks = $derived(data.tasks.filter((task) => task.grade === TaskGrade.PENDING));
  const gradedTasks = $derived(data.tasks.filter((task) => task.grade !== TaskGrade.PENDING));
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="グレード管理" />

  <section class="mb-10">
    <TaskGradeTable title="Pending" tasks={pendingTasks} />
  </section>

  <section>
    <TaskGradeTable title="グレードあり" tasks={gradedTasks} requireSearch={true} />
  </section>
</div>
