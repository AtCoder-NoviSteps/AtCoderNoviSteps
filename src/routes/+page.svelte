<!-- See: -->
<!-- https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/ -->
<script lang="ts">
  import { Heading, P, Button, Carousel } from 'flowbite-svelte';
  // @ts-ignore
  import ArrowRightOutline from 'flowbite-svelte-icons/ArrowRightOutline.svelte';

  import { PRODUCT_CATCH_PHRASE } from '$lib/constants/product-info';

  const images = [
    {
      alt: 'Problem Grades from 11Q to 4Q',
      src: '../../grade_11Q_4Q.png',
      title: 'Problem-Grades-from-11Q-to-4Q',
    },
    {
      alt: 'Problem Grades from 3Q to 6D',
      src: '../../grade_3Q_6D.png',
      title: 'Problem-Grades-from-3Q-to-6D',
    },
    {
      alt: 'Problems of Grade 5Q',
      src: '../../grade_5Q_details.png',
      title: 'Problems-of-Grade-5Q',
    },
  ];
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
    <Button href="/problems" class="w-screen md:w-1/3 m-2">問題一覧へ</Button>
    <Button color="alternative" href="/about" class="w-screen md:w-1/3 m-2">
      使い方を見る
      <ArrowRightOutline class="w-3.5 h-3.5 ml-2" />
    </Button>
  </div>

  <!-- 主要な機能 + スクリーンショット -->
  <!-- FIXME: 重複部分をコンポーネント化 -->
  <Heading tag="h2" class="mt-12 mb-3" customSize="text-xl font-medium  md:text-2xl lg:text-3xl">
    問題の回答状況を自分で記録できる
  </Heading>
  <p>「AC」「解説AC」「挑戦中」「未挑戦」から選べます</p>

  <div class="flex flex-wrap justify-center items-center">
    <video
      width="720"
      src="https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/assets/13990347/2f52354b-fa08-42ad-87c4-da97a49aa320"
      autoplay
      muted
      controls
      loop
    ></video>
  </div>

  <Heading tag="h2" class="mt-6 mb-3" customSize="text-xl font-medium  md:text-2xl lg:text-3xl">
    一歩先の問題に挑戦
  </Heading>
  <p>17段階で難易度付けされており、自分の実力に合った問題が探せます</p>

  <div class="m-4">
    <Carousel
      duration={3000}
      {images}
      imgClass="object-contain h-full w-fit"
      let:Controls
      class="min-h-[540px]"
    >
      <Controls class="items-center text-primary-700 pt-4" />
    </Carousel>
  </div>
</div>
