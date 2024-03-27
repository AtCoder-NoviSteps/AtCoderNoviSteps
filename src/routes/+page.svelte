<!-- See: -->
<!-- https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/ -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { Heading, P, Button, Img } from 'flowbite-svelte';
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
    【非公式】
    <a
      href="https://atcoder.jp/"
      class="font-medium text-primary-600 hover:underline dark:text-primary-500"
      target="_blank"
      rel="noreferrer"
    >
      AtCoder
    </a>
    上の問題について、取組み状況を記録していくサイトです。 各問題が細かく難易度付けされており、必要な知識を段階的に習得できます。
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

  <!-- 主要な機能 + スクリーンショット -->
  <!-- FIXME: 重複部分をコンポーネント化 -->
  <Heading tag="h2" class="mt-12 mb-3" customSize="text-xl font-medium  md:text-2xl lg:text-3xl">
    問題の回答状況を自分で記録できる
  </Heading>
  <p>AC (正解)、解説AC、挑戦中、未挑戦から選べます</p>

  <div class="flex flex-wrap justify-center items-center">
    <Img class="p-4" src="../../update_answer.png" alt="update answer" />
  </div>

  <Heading tag="h2" class="mt-6 mb-3" customSize="text-xl font-medium  md:text-2xl lg:text-3xl">
    ちょっと難しい問題に挑戦
  </Heading>
  <p>問題が17段階で難易度付けされており、少しずつ新しい知識を身につけられます</p>

  <div class="flex flex-wrap justify-center items-center">
    <Img class="mt-4" src="../../grade_11Q_6Q.png" alt="grade from 11Q to 6Q" />
    <Img class="" src="../../grade_5Q_2D.png" alt="grade from 5Q to 2D" />
    <Img class="" src="../../grade_3D_6D.png" alt="grade from 3D to 6D" />
  </div>
</div>
