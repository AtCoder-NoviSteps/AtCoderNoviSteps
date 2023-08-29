<script>
  import { Card, Button, Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import ExternalLinkIcon from '$lib/components/ExternalLinkIcon.svelte';

  export let data;
  let task = data.task;

  const taskUrl = `${ATCODER_BASE_CONTEST_URL}/${task.contest_id}/tasks/${task.id}`;
</script>

<div class="max-w-lg md:max-w-2xl mx-auto mb-3">
  <Breadcrumb aria-label="">
    <BreadcrumbItem href="/problems" home>Problems</BreadcrumbItem>
    <BreadcrumbItem>{task.title}</BreadcrumbItem>
  </Breadcrumb>
</div>

<!-- TODO: 回答状況に合わせてイメージ画像を差し替え -->
<!-- <p>{task.submission_result}</p> -->
<Card img="../../favicon.png" href={taskUrl} horizontal class="mb-10 mx-auto" size="md">
  <h4 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
    {task.grade.replace('Kyu', '級').replace('Dan', '段')}
  </h4>
  <h5 class="mb-2 text-3xl tracking-tight text-gray-900 dark:text-white flex">
    <div class="mr-2">
      {task.title}
    </div>
    <ExternalLinkIcon />
  </h5>
</Card>

<!-- TODO: Add face icons. -->
<!-- HACK: flowbite-svelte-icons has few face icon. -->
<!-- TODO: Add tooltips to buttons for submission results -->
<!-- TODO: ボタンの色をAtCoder本家に合わせる -->
<!-- TODO: ボタンをクリックしたら、回答状況に応じてイメージ画像を差し替え -->
<!-- See: https://tailwindcss.com/docs/align-items -->
<div class="flex flex-col items-center">
  <Button class="w-screen max-w-lg md:max-w-xl m-3">No Sub</Button>
  <Button class="w-screen max-w-lg md:max-w-xl m-3">AC</Button>
  <Button class="w-screen max-w-lg md:max-w-xl m-3">WA</Button>
</div>
