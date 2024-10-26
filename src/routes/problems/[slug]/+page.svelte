<script lang="ts">
  import { enhance } from '$app/forms';
  import { Breadcrumb, BreadcrumbItem, Img } from 'flowbite-svelte';

  import SubmissionStatusButton from '$lib/components/SubmissionStatusButton.svelte';
  import ExternalLinkIcon from '$lib/components/ExternalLinkIcon.svelte';
  import { getBackgroundColorFrom } from '$lib/services/submission_status';
  import { getTaskGradeLabel, getTaskUrl } from '$lib/utils/task';

  export let data;

  let taskResult = data.taskResult;
  let buttons = data.buttons;
</script>

<div class="container mx-auto w-5/6">
  <!-- FIXME: ホームアイコンを問題リストを表すアイコンに変更 -->
  <div class="max-w-lg md:max-w-2xl mx-auto mb-3">
    <Breadcrumb aria-label="">
      <BreadcrumbItem href="/problems" home>問題</BreadcrumbItem>
      <BreadcrumbItem>{taskResult.title}</BreadcrumbItem>
    </Breadcrumb>
  </div>

  <!-- 回答状況を表す画像のサイズ・余白などをカスタマイズするため、Flowbiteを利用している -->
  <!-- See: https://flowbite.com/docs/components/card/#card-with-image -->
  <a
    href={getTaskUrl(taskResult.contest_id, taskResult.task_id)}
    target="_blank"
    rel="noreferrer"
    class="flex flex-col items-center
    {getBackgroundColorFrom(taskResult.status_name)}
    border border-gray-200 rounded-lg max-w-lg mt-8 mb-8 mx-auto shadow md:flex-row md:max-w-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
  >
    <Img
      class="object-cover rounded-t-lg w-64 h-64 p-4 md:h-auto md:w-48 md:rounded-none md:rounded-l-lg"
      src="../../{taskResult.submission_status_image_path}"
      alt={taskResult.submission_status_label_name}
    />
    <div class="flex flex-col justify-between p-4 leading-normal">
      <h4 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {getTaskGradeLabel(taskResult.grade)}
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
  <!-- TODO: Add tooltips to buttons for submission results -->
  <!-- See: https://tailwindcss.com/docs/align-items -->
  <!-- See: https://bobbyhadz.com/blog/typescript-type-string-is-not-assignable-to-type -->
  <form method="post" class="flex flex-col items-center" use:enhance>
    {#each buttons as button}
      <SubmissionStatusButton
        value={button.status_name}
        textColor={button.text_color}
        bgColor={button.button_color}
        bgColorOnHover={button.button_color_on_hover}
        labelName={button.label_name}
      />
    {/each}
  </form>
</div>
