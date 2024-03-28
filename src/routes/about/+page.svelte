<script lang="ts">
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import { Li, List, Heading, Skeleton } from 'flowbite-svelte';

  const members = [
    { name: '@けんちょん', account: 'https://twitter.com/drken1215' },
    { name: '@ウルズニャー', account: 'https://twitter.com/uruzunyaa' },
    { name: '@nonon', account: 'https://twitter.com/nonon_math' },
    { name: '@わさせき', account: 'https://twitter.com/wasaseki' },
    { name: '@toshi201', account: 'https://twitter.com/toshicon201' },
    { name: '@あべみ', account: 'https://twitter.com/prettyhappycatty' },
    { name: '@hiro', account: 'https://twitter.com/k_hiro1818' },
  ];
</script>

<!-- TODO: 各項目を記載する -->
<!-- TODO: 必要に応じて、コンポーネントに分解する -->
<div class="container mx-auto w-5/6">
  <HeadingOne title="サービスの説明" />

  <!-- Purpose -->
  <h2 class="text-xl mt-4 mb-2">本サービスの目的</h2>
  <Skeleton size="md" class="my-8" />

  <!-- Usage -->
  <h2 class="text-xl mt-4 mb-2">使い方</h2>
  <Skeleton size="md" class="my-8" />

  <!-- Glossary -->
  <div class="mt-5 mb-5">
    <Heading tag="h2" customSize="text-xl" class="mb-2 text-xl text-gray-900 dark:text-white">
      用語集
    </Heading>
    <List tag="ul" class="space-y-1 text-gray-500 dark:text-gray-400">
      <Li>AC: 自力で正解</Li>
      <Li>解説AC: 公式もしくは有志の解説を読んで正解</Li>
      <Li>挑戦中: 少なくとも1回以上提出して、不正解</Li>
      <Li>未挑戦: これから問題を解く</Li>
    </List>
  </div>

  <!-- Grade -->
  <div class="mt-5 mb-5">
    <Heading tag="h2" customSize="text-xl" class="mb-2 text-xl text-gray-900 dark:text-white">
      難易度
    </Heading>
    <!-- FIXME: もう少しビジュアルを整えましょう -->
    <!-- 注: 難易度の基準は非公開 -->
    <List tag="ul" class="space-y-1 text-gray-500 dark:text-gray-400">
      <Li>
        (易しい) 11Q、10Q、9Q、8Q、7Q、6Q、5Q、4Q、3Q、2Q、1Q、1D、2D、3D、4D、5D、6D (難しい)
      </Li>
    </List>
  </div>

  <!-- Members -->
  <!-- TODO: メンバーの許可が得られれば、ハンドル名 + Xアカウントのアドレス -->
  <!-- TODO: 冗長なコードをリファクタリング -->
  <div class="mt-5 mb-5">
    <Heading tag="h2" customSize="text-xl" class="mb-2 text-xl text-gray-900 dark:text-white">
      開発メンバー
    </Heading>
    <List tag="ul" class="space-y-1 text-gray-500 dark:text-gray-400">
      {#each members as member}
        <Li>
          <a
            href={member.account}
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            target="_blank"
            rel="noreferrer"
          >
            {member.name}
          </a>
        </Li>
      {/each}
    </List>
  </div>
</div>
