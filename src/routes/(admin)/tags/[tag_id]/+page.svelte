<script lang="ts">
  import TagForm from '$lib/components/TagForm.svelte';

  let { data } = $props();

  let tag = data.tag;
  let tasks = data.tasks;
</script>

<div class="container mx-auto w-3/4">
  <TagForm {tag} {tasks} />
</div>
