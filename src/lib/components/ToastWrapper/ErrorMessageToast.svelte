<script lang="ts">
  import { Toast } from 'flowbite-svelte';
  import CloseCircleSolid from 'flowbite-svelte-icons/CloseCircleSolid.svelte';

  export let errorMessage: string | null = null;
</script>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/toast -->
{#if errorMessage !== null}
  <Toast color="red" class="mb-4">
    <svelte:fragment slot="icon">
      <CloseCircleSolid class="w-5 h-5" />
      <span class="sr-only">Error icon</span>
    </svelte:fragment>

    {errorMessage}
  </Toast>
{/if}
