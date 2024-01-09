<script>
  import TaskListForEdit from '$lib/components/TaskListForEdit.svelte';
  export let data;
  //let tasks = data.tasks;
  let importContests = data.importContests;
</script>

<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">Import Contests</h1>
  <TaskListForEdit {importContests} />
</div>
