<script>
  import { Heading, P, Button } from 'flowbite-svelte';
  // @ts-ignore
  import ArrowRightOutline from 'flowbite-svelte-icons/ArrowRightOutline.svelte';
</script>

<!-- TODO: かっこいいロゴを入れる -->
<div class="container mx-auto w-2/3 text-center">
  <Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold  md:text-5xl lg:text-6xl">
    TODO: サービスのキャッチフレーズを書く
  </Heading>
  <P class="mb-6 text-lg lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">
    TODO: サービスの特徴・意義を一言で要約
  </P>
  <div class="flex flex-wrap md:justify-center md:items-center">
    <Button href="/problems" class="w-screen md:w-1/3 m-2">問題を解く</Button>
    <Button color="alternative" href="/about" class="w-screen md:w-1/3 m-2">
      使い方を見る
      <ArrowRightOutline class="w-3.5 h-3.5 ml-2" />
    </Button>
  </div>

  <!-- TODO: 特徴的な機能をビジュアルを活用しながら示す -->
</div>
