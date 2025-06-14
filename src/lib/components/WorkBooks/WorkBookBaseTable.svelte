<script lang="ts">
  import { enhance } from '$app/forms';

  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'svelte-5-ui-lib';

  import { WorkBookType, type WorkbooksList } from '$lib/types/workbook';
  import { TaskGrade, type TaskResults } from '$lib/types/task';
  import type { Roles } from '$lib/types/user';

  import TitleTableHeadCell from '$lib/components/WorkBooks/TitleTableHeadCell.svelte';
  import TitleTableBodyCell from '$lib/components/WorkBooks/TitleTableBodyCell.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import CompletedTasks from '$lib/components/Trophies/CompletedTasks.svelte';
  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';
  import AcceptedCounter from '$lib/components/SubmissionStatus/AcceptedCounter.svelte';

  import { canRead, canEdit, canDelete } from '$lib/utils/authorship';
  import { getUrlSlugFrom } from '$lib/utils/workbooks';

  interface Props {
    workbookType: WorkBookType;
    workbooks: WorkbooksList;
    workbookGradeModes: Map<number, TaskGrade>;
    userId: string;
    role: Roles;
    taskResults: Map<number, TaskResults>;
  }

  let { workbookType, workbooks, workbookGradeModes, userId, role, taskResults }: Props = $props();

  function getGradeMode(workbookId: number): TaskGrade {
    return workbookGradeModes.get(workbookId) ?? TaskGrade.PENDING;
  }

  function getTaskResult(workbookId: number): TaskResults {
    return taskResults?.get(workbookId) ?? [];
  }
</script>

<!-- FIXME: 問題集の種類別にコンポーネントを分ける -->
<!-- HACK: (2024年9月時点) 問題集の仕様が大きく異なるので、暫定的に条件分岐で対処 -->
<div class="overflow-auto rounded-md border">
  <Table shadow class="text-md">
    <TableHead class="text-sm bg-gray-100">
      {#if workbookType === WorkBookType.CURRICULUM}
        <TableHeadCell class="text-center px-0">
          <div>グレード</div>
        </TableHeadCell>
        <TitleTableHeadCell />
      {:else if workbookType === WorkBookType.SOLUTION}
        <TitleTableHeadCell paddingX="px-4" />
      {:else if workbookType === WorkBookType.CREATED_BY_USER}
        <TableHeadCell>作者</TableHeadCell>
        <TitleTableHeadCell />
      {/if}

      <TableHeadCell class="ext-left min-w-[240px] max-w-[1440px] px-0">回答状況</TableHeadCell>
      <TableHeadCell></TableHeadCell>
      <TableHeadCell class="text-center px-0">修了</TableHeadCell>
      <TableHeadCell></TableHeadCell>
    </TableHead>

    <TableBody class="divide-y">
      {#each workbooks as workbook}
        {#if canRead(workbook.isPublished, userId, workbook.authorId)}
          <TableBodyRow>
            {#if workbookType === WorkBookType.CURRICULUM}
              <!-- グレード -->
              <TableBodyCell class="justify-center w-14 px-4">
                <div class="flex items-center justify-center min-w-[54px] max-w-[54px]">
                  <GradeLabel taskGrade={getGradeMode(workbook.id)} />
                </div>
              </TableBodyCell>

              <!-- タイトル -->
              <TitleTableBodyCell {workbook} />
            {:else if workbookType === WorkBookType.SOLUTION}
              <!-- タイトル -->
              <TitleTableBodyCell paddingLeft="pl-4" {workbook} />
            {:else if workbookType === WorkBookType.CREATED_BY_USER}
              <!-- 作者名 -->
              <TableBodyCell>
                <div class="truncate min-w-[96px] max-w-[120px]">
                  {workbook.authorName}
                </div>
              </TableBodyCell>

              <!-- タイトル -->
              <TitleTableBodyCell {workbook} />
            {/if}

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
            <TableBodyCell class="justify-center items-center min-w-[54px] max-w-[54px] px-0">
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
                  <a href="/workbooks/edit/{getUrlSlugFrom(workbook)}">編集</a>
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
