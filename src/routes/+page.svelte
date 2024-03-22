<!-- See: -->
<!-- https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/ -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { Heading, P, Button } from 'flowbite-svelte';
  // @ts-ignore
  import ArrowRightOutline from 'flowbite-svelte-icons/ArrowRightOutline.svelte';

  import type { PageData } from './$types';

  import { PRODUCT_CATCH_PHRASE } from '$lib/constants/product-info';

  export let data: PageData;
</script>

<!-- TODO: かっこいいロゴを入れる -->
<div class="container mx-auto w-2/3 text-center">
  <Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold  md:text-5xl lg:text-6xl">
    {PRODUCT_CATCH_PHRASE}
  </Heading>
  <P class="mb-6 text-lg lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">
    【非公式】競技プログラミングサイト
    <a
      href="https://atcoder.jp/"
      class="font-medium text-primary-600 hover:underline dark:text-primary-500"
      target="_blank"
      rel="noreferrer"
    >
      AtCoder
    </a>
    で出題された問題のうち、主にAtCoder Beginner Contest (通称、ABC) の A〜C問題の難易度を細分化し、段階的に必要な知識を習得できるようにサポートします。
  </P>
  <div class="flex flex-wrap md:justify-center md:items-center">
    <Button href="/problems" class="w-screen md:w-1/3 m-2">問題を解く</Button>
    <Button color="alternative" href="/about" class="w-screen md:w-1/3 m-2">
      使い方を見る
      <ArrowRightOutline class="w-3.5 h-3.5 ml-2" />
    </Button>
  </div>

  {#if data.username}
    <!-- See: -->
    <!-- https://tailwindcss.com/docs/justify-content#end -->
    <div class="flex flex-wrap justify-center items-center">
      <form method="post" action="logout?/logout" use:enhance>
        <Button name="logout" value="Log out" class="w-full m-2" type="submit">ログアウト</Button>
      </form>
    </div>
  {/if}
  <!-- TODO: 特徴的な機能をビジュアルを活用しながら示す -->
</div>
