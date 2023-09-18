<script lang="ts">
  import { Button, Breadcrumb, BreadcrumbItem, Img } from 'flowbite-svelte';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import ExternalLinkIcon from '$lib/components/ExternalLinkIcon.svelte';
  import type { ButtonColor } from '$lib/types/flowbite-svelte-wrapper';
  import { submissionStatusLabels } from '$lib/types/submission';

  export let data;
  let taskResult = data.taskResult;

  // FIXME: 汎用的な処理なので、外部ファイルにまとめる
  const taskUrl = `${ATCODER_BASE_CONTEST_URL}/${taskResult.contest_id}/tasks/${taskResult.task_id}`;

  const buttons = [
    {
      submission_status: 'ns',
      color: 'light' as ButtonColor,
      label: submissionStatusLabels.ns,
    },
    {
      submission_status: 'ac',
      color: 'green' as ButtonColor,
      label: submissionStatusLabels.ac,
    },
    {
      submission_status: 'wa',
      color: 'yellow' as ButtonColor,
      label: submissionStatusLabels.wa,
    },
  ];
</script>

<div class="container mx-auto w-5/6">
  <!-- FIXME: ホームアイコンを問題リストを表すアイコンに変更 -->
  <div class="max-w-lg md:max-w-2xl mx-auto mb-3">
    <Breadcrumb aria-label="">
      <BreadcrumbItem href="/problems" home>Problems</BreadcrumbItem>
      <BreadcrumbItem>{taskResult.title}</BreadcrumbItem>
    </Breadcrumb>
  </div>

  <!-- 回答状況を表す画像のサイズ・余白などをカスタマイズするため、Flowbiteを利用している -->
  <!-- See: https://flowbite.com/docs/components/card/#card-with-image -->
  <!-- FIXME: ハードコーディングしている部分を定数に差し替え -->
  <a
    href={taskUrl}
    target="_blank"
    rel="noreferrer"
    class="flex flex-col items-center bg-white border border-gray-200 rounded-lg max-w-lg mt-8 mb-8 mx-auto shadow md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
  >
    <Img
      class="object-cover rounded-t-lg w-64 h-64 p-4 md:h-auto md:w-48 md:rounded-none md:rounded-l-lg"
      src="../../{taskResult.submission_status}.png"
      alt={taskResult.submission_status}
    />
    <div class="flex flex-col justify-between p-4 leading-normal">
      <h4 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {taskResult.grade.replace('Kyu', '級').replace('Dan', '段')}
      </h4>
      <h5 class="mb-2 text-3xl tracking-tight text-gray-900 dark:text-white flex">
        <div class="mr-2">
          {taskResult.title}
        </div>
        <ExternalLinkIcon />
      </h5>
    </div>
  </a>

  <!-- TODO: Add face icons. -->
  <!-- HACK: flowbite-svelte-icons has few face icon. -->
  <!-- FIXME: ボタンの色をAtCoder本家に合わせる -->
  <!-- TODO: Add tooltips to buttons for submission results -->
  <!-- See: https://tailwindcss.com/docs/align-items -->
  <!-- See: https://bobbyhadz.com/blog/typescript-type-string-is-not-assignable-to-type -->
  <form class="flex flex-col items-center" method="post">
    {#each buttons as button}
      <Button
        name="submissionStatus"
        value={button.submission_status}
        color={button.color}
        shadow
        class="w-full max-w-md md:max-w-xl m-3"
        type="submit"
      >
        {button.label}
      </Button>
    {/each}
  </form>
</div>
