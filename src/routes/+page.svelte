<!-- See: -->
<!-- https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/ -->
<script lang="ts">
  import { Heading, P, Button, Carousel } from 'flowbite-svelte';
  // @ts-ignore
  import ArrowRightOutline from 'flowbite-svelte-icons/ArrowRightOutline.svelte';

  import { PRODUCT_CATCH_PHRASE } from '$lib/constants/product-info';

  const workBookImages = [
    {
      alt: 'List of workbooks',
      src: '../../workbooks.png',
      title: 'List-of-workbooks',
    },
    {
      alt: 'Sample of workbook with 9Q',
      src: '../../workbook_9Q_details.png',
      title: 'Sample-of-workbook-with-9Q',
    },
    {
      alt: 'Sample of workbook with 9Q final',
      src: '../../workbook_9Q_details_final.png',
      title: 'Sample-of-workbook-with-9Q-final',
    },
  ];
</script>

<!-- TODO: かっこいいロゴを入れる -->
<div class="container mx-auto text-center">
  <div class="mx-auto w-5/6 lg:w-2/3">
    <Heading
      tag="h1"
      class="mb-4"
      customSize="text-2xl font-extrabold xs:text-3xl md:text-5xl lg:text-6xl"
    >
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
    <div class="flex flex-wrap justify-center items-center">
      <Button href="/problems" class="w-full sm:w-5/6 md:w-1/3 m-2">問題一覧へ</Button>
      <Button color="alternative" href="/about" class="w-full sm:w-5/6 md:w-1/3 m-2">
        使い方を見る
        <ArrowRightOutline class="w-3.5 h-3.5 ml-2" />
      </Button>
    </div>
  </div>

  <div class="mx-auto w-11/12 md:w-5/6">
    <!-- 主要な機能 + スクリーンショット -->
    <!-- FIXME: 重複部分をコンポーネント化 -->
    <Heading tag="h2" class="mt-20 mb-3" customSize="text-xl font-medium  md:text-2xl lg:text-3xl">
      問題の回答状況を自分で記録できる
    </Heading>

    <div class="text-lg text-gray-800 dark:text-gray-300">
      <p class="mb-2">問題は17段階で難易度付けされており、自分の実力に合ったものを探せます。</p>
      <p class="mb-16">回答状況は、「AC」「解説AC」「挑戦中」「未挑戦」から選べます。</p>
    </div>

    <div class="flex flex-wrap justify-center items-center mb-20">
      <video
        width="720"
        src="https://github.com/user-attachments/assets/4d0782c0-257e-46f3-a444-77ddd8b73e0f"
        autoplay
        muted
        controls
        loop
      />
    </div>

    <!-- FIXME: キャッチコピーを改善 -->
    <Heading tag="h2" class="mt-36 mb-3" customSize="text-xl font-medium  md:text-2xl lg:text-3xl">
      (開発中) 問題集で得意を伸ばす・苦手を克服
    </Heading>

    <div class="text-lg text-gray-800 dark:text-gray-300">
      <p class="mb-2">例題・類題を通して、各トピックの基礎から応用的な方法まで身につけられます。</p>
      <p class="xs:mb-16">注: 予告なく変更される場合があります。ご了承ください。</p>
    </div>

    <div class="m-4">
      <Carousel
        duration={3000}
        images={workBookImages}
        imgClass="object-contain h-full w-fit"
        let:Controls
        class="min-h-[540px]"
      >
        <Controls class="items-center text-primary-700 pt-4" />
      </Carousel>
    </div>

    <p class="xs:mb-16"></p>
  </div>
</div>
