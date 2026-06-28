<script lang="ts">
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TaskGradeTable from './_components/TaskGradeTable.svelte';

  let { data } = $props();
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="グレード管理" />

  <section>
    <TaskGradeTable title="一覧" tasks={data.tasks} />
  </section>
</div>
