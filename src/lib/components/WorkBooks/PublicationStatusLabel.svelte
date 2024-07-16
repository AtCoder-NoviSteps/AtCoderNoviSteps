<script lang="ts">
  export let isPublished: boolean;

  const getPublicationStatusLabel = (isPublished: boolean) => {
    if (!isPublished) {
      return '非公開';
    }
  };
  const getPublicationStatusColor = (isPublished: boolean) => {
    if (!isPublished) {
      return 'bg-red-200';
    }
  };
</script>

{#if !isPublished}
  <span class="p-1 rounded-lg {getPublicationStatusColor(isPublished)}">
    {getPublicationStatusLabel(isPublished)}
  </span>
{/if}
