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
  import type { Task } from '$lib/types/task';
  import { getContestNameLabel } from '$lib/utils/contest';

  export let data;

  let workBook = data.workBook;
  let workBookTasks = workBook.workBookTasks;
  let tasks = data.tasks; // workBookTasksのtaskIdから問題情報を取得

  const getTask = (taskId: string): Task | undefined => {
    return tasks.get(taskId);
  };

  const getContestName = (taskId: string): string => {
    const contestId = getTask(taskId)?.contest_id as string;
    return getContestNameLabel(contestId);
  };

  const getTaskName = (taskId: string): string => {
    return getTask(taskId)?.title as string;
  };
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="(準備中) 問題集の詳細" />

  <Breadcrumb aria-label="">
    <BreadcrumbItem href="/workbooks" home>問題集一覧</BreadcrumbItem>
    <BreadcrumbItem>{workBook.title}</BreadcrumbItem>
  </Breadcrumb>

  <WorkBookInputFields
    authorId={workBook.authorId}
    workBookTitle={workBook.title}
    description={workBook.description}
    isPublished={workBook.isPublished}
    isOfficial={workBook.isOfficial}
    workBookType={workBook.workBookType}
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

  {#if workBookTasks.length >= 1}
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
        {#each workBookTasks as workBookTask}
          <TableBodyRow>
            <TableBodyCell>{'準備中'}</TableBodyCell>
            <TableBodyCell>{getContestName(workBookTask.taskId)}</TableBodyCell>
            <TableBodyCell>{getTaskName(workBookTask.taskId)}</TableBodyCell>
            <TableBodyCell>削除</TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  {:else}
    {'問題を1問以上登録してください。'}
  {/if}
</div>
