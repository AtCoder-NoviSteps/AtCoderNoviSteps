<script lang="ts">
  import { Table, TableBody, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';

  import type { WorkbookTableProps } from '$features/workbooks/types/workbook';

  import TitleTableHeadCell from '$features/workbooks/components/list/TitleTableHeadCell.svelte';
  import TitleTableBodyCell from '$features/workbooks/components/list/TitleTableBodyCell.svelte';
  import GradeTableBodyCell from '$features/workbooks/components/list/GradeTableBodyCell.svelte';
  import WorkbookProgressCell from '$features/workbooks/components/list/WorkbookProgressCell.svelte';
  import WorkbookCompletionCell from '$features/workbooks/components/list/WorkbookCompletionCell.svelte';
  import WorkbookAuthorActionsCell from '$features/workbooks/components/list/WorkbookAuthorActionsCell.svelte';

  import { canRead } from '$lib/utils/authorship';
  import { getGradeMode, getTaskResult } from '$features/workbooks/utils/workbooks';

  let { workbooks, gradeModesEachWorkbook, userId, role, taskResults }: WorkbookTableProps =
    $props();
</script>

<div class="overflow-auto rounded-md border border-gray-200 dark:border-gray-100">
  <Table shadow class="text-md">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="text-center px-0">
        <div>グレード</div>
      </TableHeadCell>
      <TitleTableHeadCell />
      <TableHeadCell class="text-left min-w-[240px] max-w-[1440px] px-0">回答状況</TableHeadCell>
      <TableHeadCell></TableHeadCell>
      <TableHeadCell class="text-center px-0">修了</TableHeadCell>
      <TableHeadCell></TableHeadCell>
    </TableHead>

    <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each workbooks as workbook (workbook.id)}
        {#if canRead(workbook.isPublished, userId, workbook.authorId)}
          <TableBodyRow>
            <GradeTableBodyCell taskGrade={getGradeMode(workbook.id, gradeModesEachWorkbook)} />

            <TitleTableBodyCell {workbook} />

            <WorkbookProgressCell
              workBookTasks={workbook.workBookTasks}
              taskResults={getTaskResult(workbook.id, taskResults)}
            />

            <WorkbookCompletionCell
              workBookTasks={workbook.workBookTasks}
              taskResults={getTaskResult(workbook.id, taskResults)}
            />

            <WorkbookAuthorActionsCell {workbook} {userId} {role} />
          </TableBodyRow>
        {/if}
      {/each}
    </TableBody>
  </Table>
</div>
