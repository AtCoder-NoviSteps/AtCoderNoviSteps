<script lang="ts">
  import {
    Breadcrumb,
    BreadcrumbItem,
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableBodyCell,
    TableBodyRow,
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';
  import SubmissionStatusImage from '$lib/components/SubmissionStatus/SubmissionStatusImage.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import { getBackgroundColorFrom } from '$lib/services/submission_status';
  import { getContestUrl } from '$lib/utils/contest';
  import { taskUrl } from '$lib/utils/task';
  import { getContestNameLabel } from '$lib/utils/contest';
  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { TaskResult } from '$lib/types/task';

  export let data;

  let workBook = data.workBook;
  let workBookTasks: WorkBookTaskBase[];
  let taskResults: Map<string, TaskResult>;
  $: taskResults = data.taskResults;
  let isLoggedIn = data.isLoggedIn;

  // TODO: 関数をutilへ移動させる
  const getTaskResult = (taskId: string): TaskResult => {
    return taskResults.get(taskId)!;
  };

  const getContestIdFrom = (taskId: string): string => {
    return getTaskResult(taskId)?.contest_id as string;
  };

  const getContestNameFrom = (taskId: string): string => {
    const contestId = getContestIdFrom(taskId);
    return getContestNameLabel(contestId);
  };

  const getTaskName = (taskId: string): string => {
    return getTaskResult(taskId)?.title as string;
  };

  let updatingModal: UpdatingModal;

  // FIXME: clickを1回実行するとactionsが2回実行されてしまう。原因と修正方法が分かっていない。
  function handleClick(taskId: string) {
    updatingModal.openModal(getTaskResult(taskId));
  }

  $: if (taskResults && workBook && Array.isArray(workBook.workBookTasks)) {
    workBookTasks = workBook.workBookTasks;
  } else if (!taskResults) {
    console.error('Not found taskResults.');
  } else if (!workBook || !Array.isArray(workBook.workBookTasks)) {
    console.error('Not found workBook or workBook.workBookTasks is not an array.');
  }
</script>

<div class="container mx-auto w-5/6 space-y-4">
  <div class="min-w-[240px] max-w-[1440px] truncate">
    <HeadingOne title={workBook.title} />
  </div>

  <Breadcrumb aria-label="">
    <BreadcrumbItem href="/workbooks" home>問題集一覧</BreadcrumbItem>
    <BreadcrumbItem>
      <div class="min-w-[96px] max-w-[120px] truncate">
        {workBook.title}
      </div>
    </BreadcrumbItem>
  </Breadcrumb>

  {#if workBook.description !== ''}
    <div>
      <div>説明</div>
      <div class="min-w-[240px] max-w-[1440px] truncate">
        {workBook.description}
      </div>
    </div>
  {/if}

  <!-- 問題一覧 -->
  <!-- TODO: 問題一覧ページのコンポーネントを再利用する -->
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
            <TableBodyRow
              key={getContestIdFrom(workBookTask.taskId) + workBookTask.taskId}
              class={getBackgroundColorFrom(getTaskResult(workBookTask.taskId).status_name)}
            >
              <TableBodyCell
                class="p-3 pl-3 md:pl-6 flex items-center"
                on:click={() => handleClick(workBookTask.taskId)}
              >
                <SubmissionStatusImage
                  taskResult={getTaskResult(workBookTask.taskId)}
                  {isLoggedIn}
                />
              </TableBodyCell>
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

    <UpdatingModal bind:this={updatingModal} {isLoggedIn} />
  {:else}
    {'問題を1問以上登録してください。'}
  {/if}
</div>
