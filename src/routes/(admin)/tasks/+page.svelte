<script>
  import TaskListForEdit from '$lib/components/TaskListForEdit.svelte';
  export let data;
  let tasks = data.tasks;
  let importTasks = data.importTasks;
</script>

<TaskListForEdit {tasks} {importTasks} />
