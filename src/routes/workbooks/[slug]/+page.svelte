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
  import { getContestNameLabel } from '$lib/utils/contest';
  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { Task } from '$lib/types/task';

  export let data;

  let workBook = data.workBook;
  let workBookTasks: WorkBookTaskBase[] = workBook.workBookTasks;
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
    <BreadcrumbItem>
      <div class="min-w-[96px] max-w-[120px] truncate">
        {workBook.title}
      </div>
    </BreadcrumbItem>
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
    <div class="overflow-auto rounded-md border">
      <Table shadow class="text-md">
        <TableHead class="text-sm bg-gray-100">
          <TableHeadCell class="min-w-[96px] max-w-[120px]">回答</TableHeadCell>
          <TableHeadCell class="min-w-[120px] max-w-[150px] truncate">コンテスト名</TableHeadCell>
          <TableHeadCell class="min-w-[240px] truncate">問題名</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
          {#each workBookTasks as workBookTask}
            <TableBodyRow>
              <TableBodyCell>{'準備中'}</TableBodyCell>
              <TableBodyCell>
                <div class="truncate">
                  <ExternalLinkWrapper
                    url={getContestUrl(getContestIdFrom(workBookTask.taskId))}
                    description={getContestNameFrom(workBookTask.taskId)}
                  />
                </div>
              </TableBodyCell>
              <TableBodyCell>
                <div class="truncate">
                  <ExternalLinkWrapper
                    url={taskUrl(getContestIdFrom(workBookTask.taskId), workBookTask.taskId)}
                    description={getTaskName(workBookTask.taskId)}
                  />
                </div>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {:else}
    {'問題を1問以上登録してください。'}
  {/if}
</div>
