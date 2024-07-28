<script lang="ts">
  import { enhance } from '$app/forms';
  import { get } from 'svelte/store';

  import {
    ButtonGroup,
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import { taskGradesByWorkBookTypeStore } from '$lib/stores/task_grades_by_workbook_type';
  import { canRead, canEdit, canDelete } from '$lib/utils/authorship';
  import { WorkBookType, type WorkbookList, type WorkbooksList } from '$lib/types/workbook';
  import { getTaskGradeLabel } from '$lib/utils/task';
  import { TaskGrade, type TaskGradeRange, type TaskResults } from '$lib/types/task';
  import type { Roles } from '$lib/types/user';
  import TooltipWrapper from '$lib/components/TooltipWrapper.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import PublicationStatusLabel from '$lib/components/WorkBooks/PublicationStatusLabel.svelte';
  import CompletedTasks from '$lib/components/Trophies/CompletedTasks.svelte';
  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';
  import AcceptedCounter from '$lib/components/SubmissionStatus/AcceptedCounter.svelte';

  export let workbookType: WorkBookType;
  export let workbooks: WorkbooksList;
  export let workbookGradeRanges: Map<number, TaskGradeRange>;
  export let taskResultsWithWorkBookId: Map<number, TaskResults>;
  export let loggedInUser;

  let userId = loggedInUser.id;
  let role: Roles = loggedInUser.role;

  let selectedGrade: TaskGrade =
    get(taskGradesByWorkBookTypeStore).get(workbookType) || TaskGrade.Q10;
  let filteredWorkbooks: WorkbooksList;

  $: filteredWorkbooks =
    workbookType === WorkBookType.CREATED_BY_USER
      ? workbooks
      : workbooks.filter((workbook: WorkbookList) => {
          const lower = getGradeLower(workbook.id);
          return lower === selectedGrade;
        });
  $: readableWorkbooksCount = filteredWorkbooks.reduce((count, workbook: WorkbookList) => {
    const hasReadPermission = canRead(workbook.isPublished, userId, workbook.authorId);
    return count + (hasReadPermission ? 1 : 0);
  }, 0);

  function filterByGradeLower(grade: TaskGrade) {
    selectedGrade = grade;
    taskGradesByWorkBookTypeStore.updateTaskGrade(workbookType, grade);
  }

  function getGradeLower(workbookId: number): TaskGrade {
    const workbookGradeRange = workbookGradeRanges.get(workbookId);

    return workbookGradeRange?.lower ?? TaskGrade.PENDING;
  }

  function getTaskResult(workbookId: number): TaskResults {
    return taskResultsWithWorkBookId?.get(workbookId) ?? [];
  }
</script>

<!-- TODO: 6Q〜1Q?にも対応 -->
<!-- TODO: 「ユーザ作成」の問題集には、検索機能を追加 -->
{#if workbookType !== WorkBookType.CREATED_BY_USER}
  <div class="mb-6">
    <div class="flex items-center space-x-4">
      <ButtonGroup>
        {#each [TaskGrade.Q10, TaskGrade.Q9, TaskGrade.Q8, TaskGrade.Q7] as grade}
          <Button on:click={() => filterByGradeLower(grade)}>
            {getTaskGradeLabel(grade)}
          </Button>
        {/each}
      </ButtonGroup>

      <TooltipWrapper tooltipContent="問題集のグレード（下限）を指定します" />
    </div>
  </div>
{/if}

{#if readableWorkbooksCount}
  <div class="overflow-auto rounded-md border">
    <Table shadow class="text-md">
      <TableHead class="text-sm bg-gray-100">
        {#if workbookType === WorkBookType.CREATED_BY_USER}
          <TableHeadCell>作者</TableHeadCell>
        {:else}
          <TableHeadCell class="text-center px-0">修了</TableHeadCell>
        {/if}
        <TableHeadCell class="text-left px-1">タイトル</TableHeadCell>
        <TableHeadCell class="text-left px-0">回答状況</TableHeadCell>
        <TableHeadCell></TableHeadCell>
        <TableHeadCell class="text-center px-0">
          <div>グレード</div>
        </TableHeadCell>
        <TableHeadCell></TableHeadCell>
      </TableHead>

      <TableBody tableBodyClass="divide-y">
        {#each filteredWorkbooks as workbook}
          {#if canRead(workbook.isPublished, userId, workbook.authorId)}
            <TableBodyRow>
              {#if workbookType === WorkBookType.CREATED_BY_USER}
                <TableBodyCell>
                  <div class="truncate min-w-[96px] max-w-[120px]">
                    {workbook.authorName}
                  </div>
                </TableBodyCell>
              {:else}
                <TableBodyCell tdClass="justify-center pl-2 pr-0">
                  <div class="flex justify-center items-center flex-shrink-0 w-12">
                    <CompletedTasks
                      taskResults={getTaskResult(workbook.id)}
                      allTasks={workbook.workBookTasks}
                    />
                  </div>
                </TableBodyCell>
              {/if}
              <TableBodyCell class="w-2/5 pl-2 pr-4">
                <div class="flex items-center space-x-2 truncate min-w-[240px] max-w-[480px]">
                  <PublicationStatusLabel isPublished={workbook.isPublished} />
                  <a
                    href="/workbooks/{workbook.id}"
                    class="font-medium text-primary-600 hover:underline dark:text-primary-500 truncate"
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
              <TableBodyCell class="justify-center w-14 px-2">
                <div class="flex items-center justify-center min-w-[54px] max-w-[54px]">
                  <GradeLabel taskGrade={getGradeLower(workbook.id)} />
                </div>
              </TableBodyCell>
              <TableBodyCell class="justify-center w-24 px-0">
                <div class="flex justify-center items-center space-x-3 min-w-[96px] max-w-[120px]">
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
{:else}
  <div>該当する問題集は見つかりませんでした。</div>
  <div>新しい問題集が追加されるまで、しばらくお待ちください。</div>
{/if}
