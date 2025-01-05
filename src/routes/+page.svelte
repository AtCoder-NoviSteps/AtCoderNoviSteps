<!-- See: -->
<!-- https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/ -->
<script lang="ts">
  import { Heading, Button, Carousel } from 'flowbite-svelte';
  // @ts-ignore
  import ArrowRightOutline from 'flowbite-svelte-icons/ArrowRightOutline.svelte';

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';

  import { PRODUCT_CATCH_PHRASE } from '$lib/constants/product-info';
  import { ATCODER_BASE_URL } from '$lib/constants/urls';
  import { WORKBOOKS_PAGE, ABOUT_PAGE, PROBLEMS_PAGE } from '$lib/constants/navbar-links';

  const problemImages = [
    {
      alt: 'List of problems',
      src: '../../grade_11Q_4Q.png',
      title: 'List-of-problems',
    },
    {
      alt: 'Sample of problems with 10Q',
      src: '../../grade_10Q_details.png',
      title: 'Sample-of-problems-with-10Q',
    },
  ];
</script>

<!-- TODO: かっこいいロゴを入れる -->
<div class="container mx-auto text-center">
  <div class="mx-auto py-8 w-5/6 lg:w-2/3">
    <Heading
      tag="h1"
      class="mb-4"
      customSize="text-2xl font-extrabold xs:text-3xl md:text-5xl lg:text-6xl"
    >
      {PRODUCT_CATCH_PHRASE}
    </Heading>

    <p class="mb-6 text-lg lg:text-xl sm:px-16 xl:px-48 dark:text-gray-300">
      【非公式】
      <ExternalLinkWrapper url={ATCODER_BASE_URL} description="AtCoder" />
      上の問題について、取組み状況を記録していくサイトです。 各問題が細かく難易度付けされており、必要な知識を段階的に習得できます。
    </p>

    <div class="flex flex-wrap justify-center items-center">
      <Button href={WORKBOOKS_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">問題集へ</Button>
      <Button color="alternative" href={ABOUT_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">
        使い方を見る
        <ArrowRightOutline class="w-3.5 h-3.5 ml-2" />
      </Button>
    </div>
  </div>

  <div class="mx-auto w-11/12 md:w-5/6">
    <!-- 主要な機能 + スクリーンショット -->
    <!-- FIXME: 重複部分をコンポーネント化 -->
    <!-- 問題集 -->
    <Heading
      tag="h2"
      class="mt-14 xs:mt-24 mb-3"
      customSize="text-xl font-medium md:text-2xl lg:text-3xl"
    >
      問題集で得意を伸ばす・苦手を克服
    </Heading>

    <div class="text-lg text-gray-800 dark:text-gray-300">
      <p class="mb-2">例題・類題を通して、各トピックの基礎から応用的な方法まで身につけられます。</p>
      <p class="mb-10 xs:mb-16">回答状況は、「AC」「解説AC」「挑戦中」「未挑戦」から選べます。</p>
    </div>

    <div class="flex flex-wrap justify-center items-center mb-8 xs:mb-12">
      <video
        width="720"
        src="https://github.com/user-attachments/assets/690bae58-f653-4b0d-9342-5f6813dcc7e8"
        autoplay
        muted
        controls
        loop
      >
      </video>
    </div>

    <div class="flex flex-wrap justify-center items-center">
      <Button href={WORKBOOKS_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">問題集へ</Button>
    </div>

    <!-- 問題一覧 -->
    <Heading
      tag="h2"
      class="mt-14 xs:mt-20 mb-3"
      customSize="text-xl font-medium  md:text-2xl lg:text-3xl"
    >
      問題の回答状況を自分で記録できる
    </Heading>

    <div class="text-lg text-gray-800 dark:text-gray-300">
      <p class="mb-10 xs:mb-16">
        問題は17段階で難易度付けされており、自分の実力に合ったものを探せます。
      </p>
    </div>

    <div class="m-4">
      <Carousel
        duration={3000}
        images={problemImages}
        imgClass="object-contain h-full w-fit"
        let:Controls
        class="min-h-[300px] xs:min-h-[400px] md:min-h-[540px] mb-8 xs:mb-12"
      >
        <Controls class="items-center text-primary-700 pt-4" />
      </Carousel>
    </div>

    <div class="flex flex-wrap justify-center items-center">
      <Button href={PROBLEMS_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">問題一覧へ</Button>
    </div>

    <p class="mb-10 xs:mb-16"></p>
  </div>
</div>
