<script lang="ts">
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TagListForEdit from '$lib/components/TagListForEdit.svelte';

  let { data } = $props();
  let tags = data.tags;
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="タグ一覧" />
  <TagListForEdit {tags} />
</div>
