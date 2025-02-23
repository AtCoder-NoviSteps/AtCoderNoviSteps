<!-- Note: The default setting for STWUI is too bold for h1 text,
  so I reverted to the default for Flowbite Svelte. -->

<!-- See: -->
<!-- https://stwui.vercel.app/typography -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    textSize?: string;
    fontWeight?: string;
    children?: Snippet;
  }

  let { title, textSize = 'text-3xl', fontWeight = 'font-normal', children }: Props = $props();
</script>

<h1 class={`${textSize} ${fontWeight} py-6 truncate dark:text-white`}>
  {title}

  {#if children}
    {@render children()}
  {/if}
</h1>
