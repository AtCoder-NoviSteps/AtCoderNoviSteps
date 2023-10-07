<script lang="ts">
  import { Li, List, Heading, Skeleton } from 'flowbite-svelte';
</script>

<!-- TODO: 各項目を記載する -->
<!-- TODO: 必要に応じて、コンポーネントに分解する -->
<div class="container mx-auto w-5/6">
  <h1 class="text-3xl">About</h1>

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
      <Li>No sub: 未提出</Li>
      <Li>AC: 正解</Li>
      <Li>WA: 不正解</Li>
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
      <Li>(簡単) 11Q、10Q、9Q、8Q、7Q、6Q、5Q、4Q、3Q、2Q、1Q、1D、2D、3D、4D、5D、6D (最難関)</Li>
    </List>
  </div>

  <!-- Members -->
  <!-- TODO: メンバーの許可が得られれば、ハンドル名 + Xアカウントのアドレス -->
  <!-- TODO: 冗長なコードをリファクタリング -->
  <div class="mt-5 mb-5">
    <Heading tag="h2" customSize="text-xl" class="mb-2 text-xl text-gray-900 dark:text-white">
      開発メンバー
    </Heading>
    <List tag="ul" list="none" class="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
      <Li class="pb-3 sm:pb-4">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <img
              class="w-8 h-8 rounded-full"
              src="/images/profile-picture-1.webp"
              alt="Neil profile"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate dark:text-white">Neil Sims</p>
            <p class="text-sm text-gray-500 truncate dark:text-gray-400">email@flowbite.com</p>
          </div>
        </div>
      </Li>
      <Li class="py-3 sm:py-4">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <img
              class="w-8 h-8 rounded-full"
              src="/images/profile-picture-2.webp"
              alt="Bonnie profile"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate dark:text-white">Bonnie Green</p>
            <p class="text-sm text-gray-500 truncate dark:text-gray-400">email@flowbite.com</p>
          </div>
        </div>
      </Li>
      <Li class="py-3 sm:py-4">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <img
              class="w-8 h-8 rounded-full"
              src="/images/profile-picture-3.webp"
              alt="Michael profile"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate dark:text-white">Michael Gough</p>
            <p class="text-sm text-gray-500 truncate dark:text-gray-400">email@flowbite.com</p>
          </div>
        </div>
      </Li>
      <Li class="py-3 sm:py-4">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <img
              class="w-8 h-8 rounded-full"
              src="/images/profile-picture-4.webp"
              alt="Thomas profile"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate dark:text-white">Thomas Lean</p>
            <p class="text-sm text-gray-500 truncate dark:text-gray-400">email@flowbite.com</p>
          </div>
        </div>
      </Li>
      <Li class="py-3 sm:py-4">
        <div class="flex items-center space-x-4">
          <div class="flex-shrink-0">
            <img
              class="w-8 h-8 rounded-full"
              src="/images/profile-picture-5.webp"
              alt="Lana profile"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate dark:text-white">Lana Byrd</p>
            <p class="text-sm text-gray-500 truncate dark:text-gray-400">email@flowbite.com</p>
          </div>
        </div>
      </Li>
    </List>
  </div>
</div>
