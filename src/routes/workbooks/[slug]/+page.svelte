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
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import { getContestUrl } from '$lib/utils/contest';
  import { taskUrl } from '$lib/utils/task';
  import type { Task } from '$lib/types/task';
  import { getContestNameLabel } from '$lib/utils/contest';

  export let data;

  let workBook = data.workBook;
  let workBookTasks = workBook.workBookTasks;
  let tasks = data.tasks; // workBookTasksのtaskIdから問題情報を取得

  // TODO: 関数をutilへ移動させる
  const getTask = (taskId: string): Task | undefined => {
    return tasks.get(taskId);
  };

  const getContestIdFrom = (taskId: string): string => {
    return getTask(taskId)?.contest_id as string;
  };

  const getContestNameFrom = (taskId: string): string => {
    const contestId = getContestIdFrom(taskId);
    return getContestNameLabel(contestId);
  };

  const getTaskName = (taskId: string): string => {
    return getTask(taskId)?.title as string;
  };
</script>

<div class="container mx-auto w-5/6 space-y-4">
  <HeadingOne title="問題集の詳細" />

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
    isAdmin={data.loggedInAsAdmin}
    isEditable={false}
  />

  <!-- 問題一覧 -->
  <!-- TODO: コンポーネントとして切り出す -->
  <!-- TODO: 問題一覧ページのコンポーネントを再利用する -->
  <Label class="space-y-2">
    <span>問題一覧</span>
  </Label>

  <!-- TODO: 回答状況を更新できるようにする -->
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
        {#each workBookTasks as workBookTask}
          <TableBodyRow>
            <TableBodyCell>{'準備中'}</TableBodyCell>
            <TableBodyCell>
              <ExternalLinkWrapper
                url={getContestUrl(getContestIdFrom(workBookTask.taskId))}
                description={getContestNameFrom(workBookTask.taskId)}
              ></ExternalLinkWrapper>
            </TableBodyCell>
            <TableBodyCell>
              <ExternalLinkWrapper
                url={taskUrl(getContestIdFrom(workBookTask.taskId), workBookTask.taskId)}
                description={getTaskName(workBookTask.taskId)}
              ></ExternalLinkWrapper>
            </TableBodyCell>
            <TableBodyCell></TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  {:else}
    {'問題を1問以上登録してください。'}
  {/if}
</div>
