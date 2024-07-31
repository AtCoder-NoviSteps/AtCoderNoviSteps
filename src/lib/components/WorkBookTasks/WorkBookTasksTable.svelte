<script lang="ts">
  import {
    Label,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { taskUrl } from '$lib/utils/task';
  import type { WorkBookTaskBase, WorkBookTaskCreate, WorkBookTaskEdit } from '$lib/types/workbook';

  export let workBookTasks = [] as WorkBookTaskBase[];
  export let workBookTasksForTable = [] as WorkBookTaskCreate[] | WorkBookTaskEdit[];

  function removeWorkBookTask(task: WorkBookTaskCreate | WorkBookTaskEdit) {
    workBookTasks = workBookTasks.filter((workBookTask) => workBookTask.taskId !== task.taskId);
    workBookTasksForTable = workBookTasksForTable.filter(
      (workBookTask) => workBookTask.taskId !== task.taskId,
    );
  }
</script>

{#if workBookTasksForTable.length}
  <Label class="space-y-2">
    <span>問題一覧</span>
  </Label>

  <Table shadow class="text-md">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="min-w-[240px] truncate">問題名</TableHeadCell>
      <TableHeadCell class="min-w-[120px] max-w-[150px] truncate">出典</TableHeadCell>
      <TableHeadCell class="min-w-[24px] px-0 text-center">
        <span class="sr-only">編集</span>
      </TableHeadCell>
    </TableHead>

    <TableBody tableBodyClass="divide-y">
      <!-- TODO: 編集にリンクを付ける -->
      <!-- TODO: 削除にゴミ箱マークを付ける -->
      {#each workBookTasksForTable as task}
        <TableBodyRow>
          <TableBodyCell class="xs:text-lg truncate">
            <ExternalLinkWrapper
              url={taskUrl(task.contestId, task.taskId)}
              description={task.title}
            />
          </TableBodyCell>
          <TableBodyCell class="xs:text-lg text-gray-700 dark:text-gray-300 truncate">
            {getContestNameLabel(task.contestId)}
          </TableBodyCell>
          <TableBodyCell class="px-0" on:click={() => removeWorkBookTask(task)}>
            <div class="flex justify-center items-center px-0">削除</div>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
{/if}
