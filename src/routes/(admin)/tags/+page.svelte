<script>
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TagListForEdit from '$lib/components/TagListForEdit.svelte';
  export let data;
  let tags = data.tags;
  //let importContests = data.importContests;
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="Tags" />
  <TagListForEdit {tags} />
</div>
