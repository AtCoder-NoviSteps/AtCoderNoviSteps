<script>
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TaskForm from '$lib/components/TaskForm.svelte';
  import TagListForEdit from '$lib/components/TagListForEdit.svelte';
  export let data;
  let task = data.task;
  let tags = data.tags;
</script>

<div class="container mx-auto w-5/6 md:w-1/2">
  <HeadingOne title="問題のグレードを編集" />
  <TaskForm {task} />
</div>

<div class="container mx-auto w-5/6">
  <HeadingOne title="タグ" />
  <TagListForEdit {tags} />
</div>
