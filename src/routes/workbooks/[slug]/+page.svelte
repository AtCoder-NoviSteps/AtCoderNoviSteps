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
  import CommentAndHint from '$lib/components/WorkBook/CommentAndHint.svelte';

  import { getBackgroundColorFrom } from '$lib/services/submission_status';

  import { getTaskUrl, removeTaskIndexFromTitle } from '$lib/utils/task';
  import { addContestNameToTaskIndex } from '$lib/utils/contest';

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
    const taskTableIndex = getTaskTableIndex(taskId);

    return addContestNameToTaskIndex(contestId, taskTableIndex);
  };

  const getTaskName = (taskId: string): string => {
    const title = getTaskResult(taskId)?.title as string;
    const taskTableIndex = getTaskTableIndex(taskId);

    return removeTaskIndexFromTitle(title, taskTableIndex);
  };

  const getTaskTableIndex = (taskId: string): string => {
    const taskTableIndex = getTaskResult(taskId)?.task_table_index as string;
    return taskTableIndex ? taskTableIndex : '';
  };

  const getUniqueIdUsing = (taskId: string): string => {
    return getContestIdFrom(taskId) + '-' + taskId;
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

<!-- TODO: コンポーネントが肥大化しつつあるので分割 -->
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
      <div class="min-w-[96px] max-w-[120px] sm:max-w-[300px] lg:max-w-[600px] truncate">
        {workBook.title}
      </div>
    </BreadcrumbItem>
  </Breadcrumb>

  {#if workBook.description !== '' || workBook.editorialUrl !== ''}
    <div class="pt-3 pb-6 space-y-8">
      {#if workBook.description !== ''}
        <div>
          <div class="text-2xl font-bold dark:text-white mb-2">概要</div>
          <div
            class="min-w-[240px] max-w-[1440px] break-words whitespace-normal dark:text-gray-300"
          >
            {workBook.description}
          </div>
        </div>
      {/if}

      {#if workBook.editorialUrl !== ''}
        <div>
          <div class="text-2xl font-bold dark:text-white mb-2">本問題集のトピックの解説</div>
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
      <Table shadow class="text-md table-fixed w-full">
        <TableHead class="text-xs xs:text-sm bg-gray-100">
          <TableHeadCell class="text-center w-16 xs:w-20 px-0.5 xs:px-0">グレード</TableHeadCell>
          <TableHeadCell class="text-center w-20">回答</TableHeadCell>
          <TableHeadCell class="w-1/2 truncate px-3 sm:px-6">問題名</TableHeadCell>
          <TableHeadCell class="w-1/3 hidden xs:table-cell truncate">出典</TableHeadCell>
          <TableHeadCell class="w-14 text-center px-0.5">一言</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
          {#each workBookTasks as workBookTask}
            <TableBodyRow
              id={getUniqueIdUsing(workBookTask.taskId)}
              class={getBackgroundColorFrom(getTaskResult(workBookTask.taskId).status_name)}
            >
              <!-- 問題のグレード -->
              <TableBodyCell class="justify-center w-16 px-0.5 xs:px-3">
                <div class="flex items-center justify-center min-w-[54px] max-w-[54px]">
                  <GradeLabel taskGrade={getTaskGrade(workBookTask.taskId)} />
                </div>
              </TableBodyCell>

              <!-- 回答状況の更新 -->
              <TableBodyCell
                class="justify-center w-20 px-0 pt-1 sm:pt-3 pb-0.5 sm:pb-1"
                onclick={() => handleClick(workBookTask.taskId)}
              >
                <div class="flex items-center justify-center min-w-[80px] max-w-[80px]">
                  <SubmissionStatusImage
                    taskResult={getTaskResult(workBookTask.taskId)}
                    {isLoggedIn}
                  />
                </div>
              </TableBodyCell>

              <!-- 問題のリンク -->
              <TableBodyCell class="w-1/2 px-3 sm:px-6">
                <div class="xs:text-lg truncate">
                  <ExternalLinkWrapper
                    url={getTaskUrl(getContestIdFrom(workBookTask.taskId), workBookTask.taskId)}
                    description={getTaskName(workBookTask.taskId)}
                    textSize="xs:text-lg"
                    textColorInDarkMode="dark:text-gray-300"
                  />
                </div>
              </TableBodyCell>

              <!-- 出典 -->
              <TableBodyCell class="w-1/3 hidden xs:table-cell">
                <div class="xs:text-lg text-gray-700 dark:text-gray-300 truncate">
                  {getContestNameFrom(workBookTask.taskId)}
                </div>
              </TableBodyCell>

              <!-- 一言（コメント・ヒント） -->
              <TableBodyCell class="justify-center w-14 px-0.5">
                <div class="flex items-center justify-center">
                  <CommentAndHint
                    uniqueId={getUniqueIdUsing(workBookTask.taskId)}
                    commentAndHint={workBookTask.comment}
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
