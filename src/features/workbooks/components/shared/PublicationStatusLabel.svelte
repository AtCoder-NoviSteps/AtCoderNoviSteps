<script lang="ts">
  interface Props {
    isPublished: boolean;
  }

  let { isPublished }: Props = $props();

  const getPublicationStatusLabel = (isPublished: boolean) => {
    if (!isPublished) {
      return '非公開';
    }
  };
  const getPublicationStatusColor = (isPublished: boolean) => {
    if (!isPublished) {
      return 'bg-red-200 dark:bg-red-500';
    }
  };
</script>

{#if !isPublished}
  <span class="p-1 rounded-lg {getPublicationStatusColor(isPublished)} dark:text-white">
    {getPublicationStatusLabel(isPublished)}
  </span>
{/if}
