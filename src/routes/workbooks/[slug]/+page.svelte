<script lang="ts">
  import {
    Breadcrumb,
    BreadcrumbItem,
    Label,
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableBodyCell,
    TableBodyRow,
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkBookInputFields from '$lib/components/WorkBooks/WorkBookInputFields.svelte';

  export let data;

  let workbook = data.workbook;
  let authorId = data.authorId;
  let tasks = data.tasks;
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="(準備中) 問題集の詳細" />

  <Breadcrumb aria-label="">
    <BreadcrumbItem href="/workbooks" home>問題集一覧</BreadcrumbItem>
    <BreadcrumbItem>{workbook.title}</BreadcrumbItem>
  </Breadcrumb>

  <WorkBookInputFields
    {authorId}
    workBookTitle={workbook.title}
    description={workbook.description}
    isPublished={workbook.isPublished}
    isOfficial={workbook.isOfficial}
    workBookType={workbook.workBookType}
  />

  <!-- TODO: コンポーネントとして切り出す -->
  <!-- 問題を検索 -->
  TODO: 問題を検索して、追加できるようにする
  <br />

  <!-- 問題一覧 -->
  TODO: 問題一覧ページのコンポーネントを再利用する
  <Label class="space-y-2">
    <span>問題一覧</span>
  </Label>

  {#if tasks !== null}
    <Table shadow class="text-md">
      <TableHead class="text-sm bg-gray-100">
        <TableHeadCell class="w-1/6">提出状況</TableHeadCell>
        <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
        <TableHeadCell class="w-7/12">問題名</TableHeadCell>
        <TableHeadCell class="w-1/12">
          <span class="sr-only">編集</span>
        </TableHeadCell>
      </TableHead>
      <TableBody tableBodyClass="divide-y">
        <!-- TODO: コンテスト名、問題名にリンクを付ける -->
        <!-- TODO: 編集にリンクを付ける -->
        <!-- TODO: 削除にゴミ箱マークを付ける -->
        {#each tasks as task}
          <TableBodyRow>
            <TableBodyCell>{task.status_name}</TableBodyCell>
            <TableBodyCell>{task.contest_id}</TableBodyCell>
            <TableBodyCell>{task.title}</TableBodyCell>
            <TableBodyCell>削除</TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  {:else}
    {'問題を1問以上登録してください。'}
  {/if}
</div>
