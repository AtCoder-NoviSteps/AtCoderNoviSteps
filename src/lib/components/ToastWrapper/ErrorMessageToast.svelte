<script lang="ts">
  import { Toast } from 'svelte-5-ui-lib';
  import CircleX from '@lucide/svelte/icons/circle-x';

  interface Props {
    errorMessage?: string | null;
  }

  let { errorMessage = null }: Props = $props();
</script>

<!-- See: -->
<!-- https://svelte-5-ui-lib.codewithshin.com/components/toast -->
{#if errorMessage !== null}
  <Toast color="red" class="mb-4">
    {#snippet icon()}
      <CircleX class="w-5 h-5" />
      <span class="sr-only">Error icon</span>
    {/snippet}

    {errorMessage}
  </Toast>
{/if}
