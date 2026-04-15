<!-- See: -->
<!-- https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/ -->
<script lang="ts">
  import { Heading, Button, Carousel } from 'flowbite-svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';

  import { PRODUCT_CATCH_PHRASE } from '$lib/constants/product-info';
  import { ATCODER_BASE_URL } from '$lib/constants/urls';
  import {
    WORKBOOKS_PAGE,
    PROBLEMS_PAGE,
    VOTES_PAGE,
    ABOUT_PAGE,
  } from '$lib/constants/navbar-links';

  const problemImages = [
    {
      alt: 'Contest Table',
      src: '../../contest_table.png',
      title: 'contest-table',
    },
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

  const voteImages = [
    {
      alt: 'Sample list of voting',
      src: '../../vote.png',
      title: 'Sample-list-of-voting',
    },
    {
      alt: 'Sample of voting and results',
      src: '../../vote_details.png',
      title: 'Sample-of-voting-and-results',
    },
    {
      alt: 'Vote from contest table',
      src: '../../vote_from_contest_table.png',
      title: 'Vote-from-contest-table',
    },
  ];
</script>

<!-- TODO: かっこいいロゴを入れる -->
<div class="container mx-auto text-center">
  <div class="mx-auto py-8 w-5/6 lg:w-2/3">
    <Heading tag="h1" class="text-2xl font-extrabold xs:text-3xl md:text-5xl lg:text-6xl mb-4">
      {PRODUCT_CATCH_PHRASE}
    </Heading>

    <p class="mb-6 text-lg lg:text-xl sm:px-16 xl:px-48 dark:text-gray-300">
      【非公式】
      <ExternalLinkWrapper url={ATCODER_BASE_URL} description="AtCoder" />
      上の問題について、取組み状況を記録していくサイトです。 各問題が細かく難易度付けされており、必要な知識を段階的に習得できます。
    </p>

    <div class="flex flex-wrap justify-center items-center">
      <Button href={WORKBOOKS_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">問題集へ</Button>
      <Button href={PROBLEMS_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">一覧表へ</Button>
      <Button outline href={ABOUT_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">
        使い方を見る
        <ArrowRight class="w-4 h-4 ml-2" />
      </Button>
    </div>
  </div>

  <div class="mx-auto w-11/12 md:w-5/6">
    <!-- 主要な機能 + スクリーンショット -->
    <!-- 問題集 -->
    {@render featureWithTitle('問題集で得意を伸ばす・苦手を克服')}

    <div class="text-lg text-gray-800 dark:text-gray-300">
      <p class="mb-2">例題・類題を通して、各トピックの基礎から応用的な方法まで身につけられます。</p>
      <p class="mb-10 xs:mb-16">回答状況は、「AC」「解説AC」「挑戦中」「未挑戦」から選べます。</p>
    </div>

    <div class="flex flex-wrap justify-center items-center mb-8 xs:mb-12">
      <video
        width="720"
        src="https://github.com/user-attachments/assets/fec06b21-dc31-497f-80bc-181e64394da9"
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

    <!-- 一覧表 -->
    {@render featureWithTitle('問題の回答状況を自分で記録できる')}

    <div class="text-lg text-gray-800 dark:text-gray-300">
      <p class="mb-10 xs:mb-16">
        問題は17段階で難易度付けされており、自分の実力に合ったものを探せます。
      </p>
    </div>

    {@render carouselWrapper(problemImages)}

    <div class="flex flex-wrap justify-center items-center">
      <Button href={PROBLEMS_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">一覧表へ</Button>
    </div>

    <!-- 投票 -->
    {@render featureWithTitle('コミュニティで問題集を育てる')}

    <div class="text-lg text-gray-800 dark:text-gray-300">
      <p class="mb-2">問題の難易度の評価・分類が揃うほど、問題集の作成・更新が加速します。</p>
      <p class="mb-10 xs:mb-16">
        難易度の評価基準は
        <ExternalLinkWrapper
          url={'https://docs.google.com/spreadsheets/d/1GJbTRRBsoBaY-CXIr3dIXmxkwacV4nHOTOIMCmo__Ug/edit?gid=0#gid=0'}
          description="公開"
        />
        しており、あなたの一票がその一歩になります。
      </p>
    </div>

    {@render carouselWrapper(voteImages)}

    <div class="flex flex-wrap justify-center items-center">
      <Button href={VOTES_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">投票へ</Button>
      <Button href={PROBLEMS_PAGE} class="w-full sm:w-5/6 md:w-1/3 m-2">一覧表へ</Button>
    </div>

    <p class="mb-10 xs:mb-16"></p>
  </div>
</div>

{#snippet featureWithTitle(title: string)}
  <Heading tag="h2" class="text-xl font-medium md:text-2xl lg:text-3xl mt-14 xs:mt-24 mb-3">
    {title}
  </Heading>
{/snippet}

{#snippet carouselWrapper(images: { alt: string; src: string; title: string }[])}
  <div class="m-4 mb-8 xs:mb-12 overflow-hidden">
    <Carousel
      {images}
      duration={3000}
      slideFit="contain"
      class="min-h-75 xs:min-h-100 md:min-h-135"
    />
  </div>
{/snippet}
