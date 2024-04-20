<script lang="ts">
  import { enhance } from '$app/forms';
  import SuperDebug from 'sveltekit-superforms';
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

  export let data;

  const { form } = superForm(data.form);
  console.log(form);

  let isPublished = [
    { value: false, name: '非公開' },
    { value: true, name: '公開' },
  ];
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
    TODO: ユーザ名は自動的に取得できるようにする
    <Label class="space-y-2">
      <span>ユーザ名</span>
      <Input size="md" name="userId" bind:value={$form.userId} />
    </Label>

    <!-- タイトル -->
    <!-- TODO: バリデーションを追加 -->
    <Label class="space-y-2">
      <span>タイトル</span>
      <Input size="md" name="title" bind:value={$form.title} />
    </Label>

    <!-- 問題集の種類を指定 -->

    <!-- 一般公開の有無 -->
    <Label class="space-y-2">
      <span>公開状況</span>
      <Select class="" name="isPublished" items={isPublished} bind:value={$form.isPublished} />
    </Label>

    <!-- 問題を検索 -->
    TODO: 問題を検索して、追加できるようにする
    <br />

    <!-- 問題一覧 -->
    TODO: 問題一覧ページのコンポーネントを再利用する
    <Label class="space-y-2">
      <span>問題一覧</span>
    </Label>

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
    <SubmissionButton labelName="作成" />
  </form>
</div>

<SuperDebug data={$form} />
