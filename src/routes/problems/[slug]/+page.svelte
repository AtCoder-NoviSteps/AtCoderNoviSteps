<script lang="ts">
  import { Card, Button, Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import ExternalLinkIcon from '$lib/components/ExternalLinkIcon.svelte';

  export let data;
  let task = data.task;

  // FIXME: 汎用的な処理なので、外部ファイルにまとめる
  const taskUrl = `${ATCODER_BASE_CONTEST_URL}/${task.contest_id}/tasks/${task.id}`;
</script>

<div class="container mx-auto w-5/6">
  <!-- FIXME: ホームアイコンを問題リストを表すアイコンに変更 -->
  <div class="max-w-lg md:max-w-2xl mx-auto mb-3">
    <Breadcrumb aria-label="">
      <BreadcrumbItem href="/problems" home>Problems</BreadcrumbItem>
      <BreadcrumbItem>{task.title}</BreadcrumbItem>
    </Breadcrumb>
  </div>

  <!-- TODO: 回答状況に合わせてイメージ画像を差し替え -->
  <!-- FIXME: ハードコーディングしている部分を定数に差し替え -->
  <Card
    img="../../favicon.png"
    href={taskUrl}
    target="_blank"
    rel="noreferrer"
    horizontal
    class="mb-7 mx-auto"
    size="md"
  >
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
  <!-- TODO: ボタンをクリックしたら、回答状況に応じてイメージ画像を差し替え -->
  <!-- FIXME: ボタンの色をAtCoder本家に合わせる -->
  <!-- FIXME: ハードコーディングしている部分を定数に差し替え -->
  <!-- TODO: Add tooltips to buttons for submission results -->
  <!-- See: https://tailwindcss.com/docs/align-items -->
  <form class="flex flex-col items-center" name="hoge" method="post">
    <Button
      id="NoSub"
      name="submissionStatus"
      value="NoSub"
      color="light"
      shadow
      class="w-full max-w-md md:max-w-xl m-3"
      type="submit"
    >
      No Sub
    </Button>
    <Button
      id="AC"
      name="submissionStatus"
      value="AC"
      color="green"
      shadow
      class="w-full max-w-md md:max-w-xl m-3"
      type="submit"
    >
      AC
    </Button>
    <Button
      id="WA"
      name="submissionStatus"
      value="WA"
      color="yellow"
      shadow
      class="w-full max-w-md md:max-w-xl m-3"
      type="submit"
    >
      WA
    </Button>
  </form>
</div>
