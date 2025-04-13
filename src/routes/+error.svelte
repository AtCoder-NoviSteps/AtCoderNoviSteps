<script lang="ts">
  import { page } from '$app/state';

  import { Heading } from 'svelte-5-ui-lib';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
</script>

<div
  class="container mx-auto md:w-4/5 lg:w-2/3 py-4 md:py-8 px-3 md:px-0 flex flex-col items-center"
>
  <HeadingOne title="エラーが発生しました" />

  {#if page.error}
    <Heading tag="h2" class="text-3xl mb-3 text-gray-900 dark:text-gray-300">
      {page.status}
    </Heading>

    <p class="dark:text-gray-300">{page.error.message}</p>
  {/if}
</div>
