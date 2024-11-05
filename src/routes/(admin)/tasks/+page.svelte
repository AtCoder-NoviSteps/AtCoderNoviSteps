<script>
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TaskListForEdit from '$lib/components/TaskListForEdit.svelte';
  export let data;

  let importContests = data.importContests;
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="問題のインポート" />
  <TaskListForEdit {importContests} />
</div>
