<script>
  import TaskForm from '$lib/components/TaskForm.svelte';
  import TagListForEdit from '$lib/components/TagListForEdit.svelte';
  export let data;
  let task = data.task;
  let tags = data.tags;
</script>

<div class="container mx-auto w-1/4">
  <TaskForm {task} />
</div>

<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">Tags</h1>
  <TagListForEdit {tags} />
</div>
