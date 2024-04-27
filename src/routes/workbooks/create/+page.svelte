<script lang="ts">
  import { enhance } from '$app/forms';
  import { superForm } from 'sveltekit-superforms/client';
  import {
    Breadcrumb,
    BreadcrumbItem,
    Label,
    Input,
    Select,
    // Table,
    // TableBody,
    // TableBodyCell,
    // TableBodyRow,
    // TableHead,
    // TableHeadCell,
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';
  import { WorkBookType } from '$lib/types/workbook';

  export let data;

  const { form } = superForm(data.form);
  const user = data.user;
  const isAdmin = data.isAdmin;

  $form.userId = user.id;
  $form.isOfficial = isAdmin;
  $form.workBookType = isAdmin ? WorkBookType.TEXTBOOK : WorkBookType.CREATED_BY_USER;

  let isPublished = [
    { value: false, name: '非公開' },
    { value: true, name: '公開' },
  ];

  const workBookType = (isAdmin: boolean) => {
    if (isAdmin) {
      const types = [
        { value: WorkBookType.TEXTBOOK, name: '教科書' },
        { value: WorkBookType.SOLUTION, name: '解法別' },
        { value: WorkBookType.GENRE, name: 'ジャンル別' },
        { value: WorkBookType.THEME, name: 'テーマ別' },
      ];

      return types;
    } else {
      const types = [{ value: WorkBookType.CREATED_BY_USER, name: 'ユーザ作成' }];

      return types;
    }
  };
</script>

<!-- TODO: パンくずリストを用意 -->
<div class="container mx-auto w-5/6">
  <form method="post" use:enhance>
    <HeadingOne title="問題集を作成" />

    <!-- TODO: まずは、ベタ打ちでコンポーネントを用意 -->
    <!-- TODO: 問題集の詳細ページのコンポーネントとほぼ共通しているので再利用する -->

    <Breadcrumb aria-label="">
      <BreadcrumbItem href="/workbooks" home>問題集一覧</BreadcrumbItem>
      <!-- <BreadcrumbItem>{workbook.title}</BreadcrumbItem> -->
    </Breadcrumb>

    <!-- 作者 -->
    <Label class="space-y-2">
      <span>ユーザ名</span>
      <Input size="md" name="userName" readonly bind:value={user.name} />
    </Label>

    <Input type="hidden" size="md" name="userId" bind:value={$form.userId} />

    <!-- タイトル -->
    <!-- TODO: バリデーションを追加 -->
    <Label class="space-y-2">
      <span>タイトル</span>
      <Input size="md" name="title" bind:value={$form.title} />
    </Label>

    <!-- 一般公開の有無 -->
    <Label class="space-y-2">
      <span>公開状況</span>
      <Select class="" name="isPublished" items={isPublished} bind:value={$form.isPublished} />
    </Label>

    <!-- 管理者 / 一般ユーザ -->
    <Input type="hidden" size="md" name="isOfficial" bind:value={$form.isOfficial} />

    <!-- 管理者のみ: 問題集の区分を指定-->
    <Label class="space-y-2">
      <span>問題集の区分</span>
      <Select
        class=""
        name="workBookType"
        items={workBookType(isAdmin)}
        bind:value={$form.workBookType}
      />
    </Label>

    <!-- 問題を検索 -->
    TODO: 問題を検索して、追加できるようにする
    <br />

    <!-- 問題一覧 -->
    <Label class="space-y-2">
      <span>問題一覧</span>
    </Label>

    TODO: 指定した問題を表示できるようにする
    <!-- <Table shadow class="text-md">
      <TableHead class="text-sm bg-gray-100">
        <TableHeadCell class="w-1/6">提出状況</TableHeadCell>
        <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
        <TableHeadCell class="w-7/12">問題名</TableHeadCell>
        <TableHeadCell class="w-1/12">
          <span class="sr-only">編集</span>
        </TableHeadCell>
      </TableHead> -->
    <!-- TODO: ダミーデータをオブジェクトとしてまとめて、eachで取り出せるように -->
    <!-- <TableBody tableBodyClass="divide-y"> -->
    <!-- TODO: コンテスト名、問題名にリンクを付ける -->
    <!-- TODO: 編集にリンクを付ける -->
    <!-- TODO: 削除にゴミ箱マークを付ける -->
    <!-- {#each workbook.tasks as task}
        <TableBodyRow>
          <TableBodyCell>{task.status_name}</TableBodyCell>
          <TableBodyCell>{task.contest_id}</TableBodyCell>
          <TableBodyCell>{task.title}</TableBodyCell>
          <TableBodyCell>削除</TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody> -->
    <!-- </Table> -->

    <!-- 作成ボタンを追加 -->
    <div class="flex flex-wrap md:justify-center md:items-center">
      <SubmissionButton width="w-full md:max-w-md " labelName="作成" />
    </div>
  </form>
</div>