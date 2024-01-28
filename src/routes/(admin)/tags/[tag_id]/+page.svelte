<script>
  import TagForm from '$lib/components/TagForm.svelte';
  export let data;
  let tag = data.tag;
  let tasks = data.tasks;
</script>

<div class="container mx-auto w-3/4">
  <TagForm {tag} {tasks} />
</div>
