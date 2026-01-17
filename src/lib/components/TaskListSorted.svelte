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

  interface Props {
    taskResults: TaskResults;
  }

  let { taskResults }: Props = $props();
</script>

<!-- TODO: Implement responsive design -->
<!-- FIXME: Align icon sizes with other pages -->
<div class="rounded-md border border-gray-200 dark:border-gray-100 overflow-hidden">
  <Table shadow hoverable={true} class="text-md">
    <TableHead class="text-md bg-gray-100">
      <TableHeadCell class="w-1/6">回答</TableHeadCell>
      <TableHeadCell class="w-1/2">問題名</TableHeadCell>
      <TableHeadCell class="w-1/6">出典</TableHeadCell>
      <TableHeadCell class="w-1/6">更新日時</TableHeadCell>
    </TableHead>

    <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
      {#each taskResults as taskResult}
        <TableBodyRow>
          <TableBodyCell class="p-3">
            <Img
              src="../../{taskResult.submission_status_image_path}"
              alt={taskResult.submission_status_label_name}
              class="h-7 w-7 xs:h-8 xs:w-8"
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
</div>
