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

  import PublicationStatusLabel from '$lib/components/WorkBooks/PublicationStatusLabel.svelte';
  import CompletedTasks from '$lib/components/Trophies/CompletedTasks.svelte';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';
  import SubmissionStatusImage from '$lib/components/SubmissionStatus/SubmissionStatusImage.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import { getBackgroundColorFrom } from '$lib/services/submission_status';
  import { taskUrl } from '$lib/utils/task';
  import { getContestNameLabel } from '$lib/utils/contest';
  import type { WorkBookTaskBase } from '$lib/types/workbook';
  import type { TaskResult, TaskGrade } from '$lib/types/task';

  export let data;

  let workBook = data.workBook;
  let workBookTasks: WorkBookTaskBase[];
  let taskResults: Map<string, TaskResult>;
  $: taskResults = data.taskResults;
  let isLoggedIn = data.isLoggedIn;

  // TODO: 関数をutilへ移動させる
  const getTaskResult = (taskId: string): TaskResult => {
    return taskResults?.get(taskId) as TaskResult;
  };

  const getTaskGrade = (taskId: string): TaskGrade => {
    return getTaskResult(taskId)?.grade as TaskGrade;
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

  // HACK: clickを1回実行するとactionsが2回実行されてしまう。原因と修正方法が分かっていない。
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
  <div class="flex items-center space-x-1 sm:space-x-3">
    {#if !workBook.isPublished}
      <div class="min-w-[56px] max-w-[56px] px-0">
        <PublicationStatusLabel isPublished={workBook.isPublished} />
      </div>
    {/if}
    <CompletedTasks
      taskResults={Array.from(taskResults.values())}
      allTasks={workBook.workBookTasks}
    />
    <div class="min-w-[240px] max-w-[1440px] truncate">
      <HeadingOne title={workBook.title} />
    </div>
  </div>

  <Breadcrumb aria-label="">
    <BreadcrumbItem href="/workbooks" home>問題集</BreadcrumbItem>
    <BreadcrumbItem>
      <div class="min-w-[96px] max-w-[120px] truncate">
        {workBook.title}
      </div>
    </BreadcrumbItem>
  </Breadcrumb>

  {#if workBook.description !== '' || workBook.editorialUrl !== ''}
    <div class="pt-3 pb-6 space-y-4">
      {#if workBook.description !== ''}
        <div>
          <div class="text-2xl font-bold dark:text-white">概要</div>
          <div class="min-w-[240px] max-w-[1440px] truncate dark:text-gray-300">
            {workBook.description}
          </div>
        </div>
      {/if}

      {#if workBook.editorialUrl !== ''}
        <div>
          <div class="text-2xl font-bold dark:text-white">トピックの解説</div>
          <div class="min-w-[240px] max-w-[1440px] truncate dark:text-white">
            <ExternalLinkWrapper url={workBook.editorialUrl} description="外部リンク" />
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- 問題一覧 -->
  {#if workBookTasks.length}
    <div class="overflow-auto rounded-md border">
      <Table shadow class="text-md">
        <TableHead class="text-sm bg-gray-100">
          <TableHeadCell class="min-w-[96px] max-w-[120px]">回答</TableHeadCell>
          <TableHeadCell class="text-center px-0">グレード</TableHeadCell>
          <TableHeadCell class="min-w-[240px] max-w-2/3 truncate">問題名</TableHeadCell>
          <TableHeadCell class="min-w-[120px] max-w-[150px] truncate">出典</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
          {#each workBookTasks as workBookTask}
            <TableBodyRow
              key={getContestIdFrom(workBookTask.taskId) + '-' + workBookTask.taskId}
              class={getBackgroundColorFrom(getTaskResult(workBookTask.taskId).status_name)}
            >
              <TableBodyCell
                class="justify-center w-20 px-0.5 sm:px-3"
                on:click={() => handleClick(workBookTask.taskId)}
              >
                <div class="flex items-center justify-center min-w-[80px] max-w-[80px]">
                  <SubmissionStatusImage
                    taskResult={getTaskResult(workBookTask.taskId)}
                    {isLoggedIn}
                  />
                </div>
              </TableBodyCell>
              <TableBodyCell class="justify-center w-14 px-0">
                <div class="flex items-center justify-center min-w-[54px] max-w-[54px]">
                  <GradeLabel taskGrade={getTaskGrade(workBookTask.taskId)} />
                </div>
              </TableBodyCell>
              <TableBodyCell>
                <div class="xs:text-lg truncate">
                  <ExternalLinkWrapper
                    url={taskUrl(getContestIdFrom(workBookTask.taskId), workBookTask.taskId)}
                    description={getTaskName(workBookTask.taskId)}
                  />
                </div>
              </TableBodyCell>
              <TableBodyCell>
                <div class="xs:text-lg text-gray-700 dark:text-gray-300 truncate">
                  {getContestNameFrom(workBookTask.taskId)}
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
