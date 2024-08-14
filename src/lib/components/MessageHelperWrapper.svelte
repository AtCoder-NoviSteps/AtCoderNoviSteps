<script lang="ts">
  import { Helper } from 'flowbite-svelte';

  export let message;
</script>

{#if message}
  <Helper class="mt-2 dark:text-red-500" color="red">
    <span class="font-medium">{message}</span>
  </Helper>
{/if}
