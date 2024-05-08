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

<Label class="space-y-2">
  <span>問題一覧</span>
</Label>

{#if workBookTasksForTable.length > 0}
  <Table shadow class="text-md">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
      <TableHeadCell class="w-7/12">問題名</TableHeadCell>
      <TableHeadCell class="w-1/12">
        <span class="sr-only">編集</span>
      </TableHeadCell>
    </TableHead>

    <TableBody tableBodyClass="divide-y">
      <!-- TODO: 編集にリンクを付ける -->
      <!-- TODO: 削除にゴミ箱マークを付ける -->
      {#each workBookTasksForTable as task}
        <TableBodyRow>
          <TableBodyCell>{task.contestId}</TableBodyCell>
          <TableBodyCell>{task.title}</TableBodyCell>
          <TableBodyCell on:click={() => removeWorkBookTask(task)}>削除</TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
{:else}
  問題を1問以上登録してください。
{/if}
