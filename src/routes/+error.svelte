<script lang="ts">
  import { page } from '$app/state';

  import { Heading, Button } from 'flowbite-svelte';
  import HeadingOne from '$lib/components/HeadingOne.svelte';

  import { HOME_PAGE } from '$lib/constants/navbar-links';
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

  <div class="flex justify-center mt-6">
    <Button href={HOME_PAGE} color="primary" class="px-6">ホームに戻る</Button>
  </div>
</div>
