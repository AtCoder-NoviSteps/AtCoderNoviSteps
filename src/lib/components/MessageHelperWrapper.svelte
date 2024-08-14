<script lang="ts">
  import { Helper } from 'flowbite-svelte';

  export let marginTop = 'mt-2';
  export let message;
</script>

{#if message}
  <Helper class="{marginTop} dark:text-red-500" color="red">
    <span class="font-medium">{message}</span>
  </Helper>
{/if}
