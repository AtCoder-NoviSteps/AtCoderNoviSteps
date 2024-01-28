<script>
  import TagListForEdit from '$lib/components/TagListForEdit.svelte';
  export let data;
  let tags = data.tags;
  //let importContests = data.importContests;
</script>

<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">Tags</h1>
  <TagListForEdit {tags} />
</div>
