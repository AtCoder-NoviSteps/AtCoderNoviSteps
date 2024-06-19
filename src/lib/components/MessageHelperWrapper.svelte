<script lang="ts">
  import { Helper } from 'flowbite-svelte';

  export let message;
</script>

{#if message}
  <Helper class="mt-2" color="red">
    <span class="font-medium">{message}</span>
  </Helper>
{/if}
