<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    defaultWidth?: string;
    lgWidth?: string;
    children?: Snippet;
  }

  let { defaultWidth = 'w-5/6', lgWidth = 'lg:w-3/4', children }: Props = $props();
</script>

<div class={`container ${defaultWidth} ${lgWidth} mx-auto flex flex-col items-center`}>
  {@render children?.()}
</div>
