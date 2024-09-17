<script lang="ts">
  import {
    Img,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import type { TaskResults } from '$lib/types/task';

  import { addContestNameToTaskIndex } from '$lib/utils/contest';
  import { removeTaskIndexFromTitle } from '$lib/utils/task';

  export let taskResults: TaskResults;
</script>

<Table shadow hoverable={true} class="text-md">
  <TableHead class="text-md bg-gray-100">
    <TableHeadCell class="w-1/6">回答</TableHeadCell>
    <TableHeadCell class="w-1/2">問題名</TableHeadCell>
    <TableHeadCell class="w-1/6">出典</TableHeadCell>
    <TableHeadCell class="w-1/6">更新日時</TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each taskResults as taskResult}
      <TableBodyRow>
        <TableBodyCell class="p-3">
          <Img
            src="../../{taskResult.submission_status_image_path}"
            alt={taskResult.submission_status_label_name}
            class="md:h-16 md:w-16"
          />
        </TableBodyCell>
        <TableBodyCell>
          <a
            href="/problems/{taskResult.task_id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            {removeTaskIndexFromTitle(taskResult.title, taskResult.task_table_index)}
          </a>
        </TableBodyCell>
        <TableBodyCell>
          {addContestNameToTaskIndex(taskResult.contest_id, taskResult.task_table_index)}
        </TableBodyCell>
        <TableBodyCell>{taskResult.updated_at.toLocaleString()}</TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
