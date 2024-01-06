<script>
  import TaskForm from '$lib/components/TaskForm.svelte';
  export let data;
  let task = data.task;
</script>

<div class="container mx-auto w-1/4">
  <TaskForm {task} />
</div>
