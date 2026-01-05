<script lang="ts">
  import { Helper } from 'flowbite-svelte';

  // HACK: Use any type out of necessity to maintain compatibility with existing code.
  interface Props {
    marginTop?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any;
  }

  let { marginTop = 'mt-2', message }: Props = $props();
</script>

{#if message}
  <Helper class="{marginTop} dark:text-red-500" color="red">
    <span class="font-medium">{message}</span>
  </Helper>
{/if}
