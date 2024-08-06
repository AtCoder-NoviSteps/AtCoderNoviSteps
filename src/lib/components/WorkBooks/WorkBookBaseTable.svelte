<script lang="ts">
  import { enhance } from '$app/forms';

  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import { WorkBookType, type WorkbooksList } from '$lib/types/workbook';
  import { TaskGrade, type TaskGradeRange, type TaskResults } from '$lib/types/task';
  import type { Roles } from '$lib/types/user';

  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import PublicationStatusLabel from '$lib/components/WorkBooks/PublicationStatusLabel.svelte';
  import CompletedTasks from '$lib/components/Trophies/CompletedTasks.svelte';
  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';
  import AcceptedCounter from '$lib/components/SubmissionStatus/AcceptedCounter.svelte';

  import { canRead, canEdit, canDelete } from '$lib/utils/authorship';

  export let workbookType: WorkBookType;
  export let workbooks: WorkbooksList;
  export let workbookGradeRanges: Map<number, TaskGradeRange>;
  export let userId: string;
  export let role: Roles;
  export let taskResults: Map<number, TaskResults>;

  function getGradeLower(workbookId: number): TaskGrade {
    const workbookGradeRange = workbookGradeRanges.get(workbookId);

    return workbookGradeRange?.lower ?? TaskGrade.PENDING;
  }

  function getTaskResult(workbookId: number): TaskResults {
    return taskResults?.get(workbookId) ?? [];
  }
</script>

<div class="overflow-auto rounded-md border">
  <Table shadow class="text-md">
    <TableHead class="text-sm bg-gray-100">
      {#if workbookType === WorkBookType.CREATED_BY_USER}
        <TableHeadCell>作者</TableHeadCell>
      {:else}
        <TableHeadCell class="text-center px-0">
          <div>グレード</div>
        </TableHeadCell>
      {/if}
      <TableHeadCell
        class="text-left min-w-[240px] max-w-[240px] lg:max-w-[280px] xl:max-w-[360px] 2xl:max-w-[480px] px-1 xs:px-3"
      >
        タイトル
      </TableHeadCell>
      <TableHeadCell class="ext-left min-w-[240px] max-w-[1440px] px-0">回答状況</TableHeadCell>
      <TableHeadCell></TableHeadCell>
      <TableHeadCell class="text-center px-0">修了</TableHeadCell>
      <TableHeadCell></TableHeadCell>
    </TableHead>

    <TableBody tableBodyClass="divide-y">
      {#each workbooks as workbook}
        {#if canRead(workbook.isPublished, userId, workbook.authorId)}
          <TableBodyRow>
            {#if workbookType === WorkBookType.CREATED_BY_USER}
              <TableBodyCell>
                <div class="truncate min-w-[96px] max-w-[120px]">
                  {workbook.authorName}
                </div>
              </TableBodyCell>
            {:else}
              <TableBodyCell class="justify-center w-14 px-2">
                <div class="flex items-center justify-center min-w-[54px] max-w-[54px]">
                  <GradeLabel taskGrade={getGradeLower(workbook.id)} />
                </div>
              </TableBodyCell>
            {/if}
            <TableBodyCell class="w-2/5 pl-2 xs:pl-4 pr-4">
              <div
                class="flex items-center space-x-2 truncate min-w-[240px] max-w-[240px] lg:max-w-[300px] xl:max-w-[380px] 2xl:max-w-[480px]"
              >
                <PublicationStatusLabel isPublished={workbook.isPublished} />
                <a
                  href="/workbooks/{workbook.id}"
                  class="flex-1 font-medium xs:text-lg text-primary-600 hover:underline dark:text-primary-500 truncate"
                >
                  {workbook.title}
                </a>
              </div>
            </TableBodyCell>
            <TableBodyCell class="min-w-[240px] max-w-[1440px] px-0">
              <ThermometerProgressBar
                workBookTasks={workbook.workBookTasks}
                taskResults={getTaskResult(workbook.id)}
                width="w-full"
              />
            </TableBodyCell>
            <TableBodyCell class="justify-center w-24 px-1">
              <div class="min-w-[48px] max-w-[96px]">
                <AcceptedCounter
                  workBookTasks={workbook.workBookTasks}
                  taskResults={getTaskResult(workbook.id)}
                />
              </div>
            </TableBodyCell>
            <TableBodyCell tdClass="justify-center items-center min-w-[54px] max-w-[54px]">
              <div class="flex justify-center items-center">
                <CompletedTasks
                  taskResults={getTaskResult(workbook.id)}
                  allTasks={workbook.workBookTasks}
                />
              </div>
            </TableBodyCell>
            <TableBodyCell class="justify-center w-24 px-0">
              <div
                class="flex justify-center items-center space-x-3 min-w-[96px] max-w-[120px] text-gray-700 dark:text-gray-300"
              >
                {#if canEdit(userId, workbook.authorId, role, workbook.isPublished)}
                  <a href="/workbooks/edit/{workbook.id}">編集</a>
                {/if}

                {#if canDelete(userId, workbook.authorId)}
                  <form method="POST" action="?/delete&slug={workbook.id}" use:enhance>
                    <button>削除</button>
                  </form>
                {/if}
              </div>
            </TableBodyCell>
          </TableBodyRow>
        {/if}
      {/each}
    </TableBody>
  </Table>
</div>
