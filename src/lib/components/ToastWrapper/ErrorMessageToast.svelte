<script lang="ts">
  import { Toast } from 'svelte-5-ui-lib';
  import CloseCircleSolid from 'flowbite-svelte-icons/CloseCircleSolid.svelte';

  interface Props {
    errorMessage?: string | null;
  }

  let { errorMessage = null }: Props = $props();
</script>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/toast -->
{#if errorMessage !== null}
  <Toast color="red" class="mb-4">
    {#snippet icon()}
      <CloseCircleSolid class="w-5 h-5" />
      <span class="sr-only">Error icon</span>
    {/snippet}

    {errorMessage}
  </Toast>
{/if}
