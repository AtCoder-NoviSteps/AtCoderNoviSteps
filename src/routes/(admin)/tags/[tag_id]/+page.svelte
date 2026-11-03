<script lang="ts">
  import TagForm from '#lib/components/TagForm.svelte';

  let { data } = $props();

  let tag = $derived(data.tag);
  let tasks = $derived(data.tasks);
</script>

<div class="container mx-auto w-3/4">
  <TagForm {tag} {tasks} />
</div>
