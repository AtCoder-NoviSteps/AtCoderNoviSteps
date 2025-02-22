<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    defaultWidth?: string;
    children?: Snippet;
  }

  let { defaultWidth = 'w-5/6', children }: Props = $props();
</script>

<div class={`container ${defaultWidth} lg:w-3/4 mx-auto flex flex-col items-center`}>
  {@render children?.()}
</div>
