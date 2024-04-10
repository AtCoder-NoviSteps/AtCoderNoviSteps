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
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import { getContestNameLabel } from '$lib/utils/contest';

  export let taskResults: TaskResults;
</script>

<Table shadow hoverable={true} class="text-md">
  <TableHead class="text-md bg-gray-100">
    <TableHeadCell class="w-1/6">提出状況</TableHeadCell>
    <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
    <TableHeadCell class="w-1/2">問題名</TableHeadCell>
    <TableHeadCell class="w-1/6">更新時間</TableHeadCell>
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
            href="{ATCODER_BASE_CONTEST_URL}/{taskResult.contest_id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            target="_blank"
            rel="noreferrer"
          >
            {getContestNameLabel(taskResult.contest_id)}
          </a>
        </TableBodyCell>
        <TableBodyCell>
          <a
            href="/problems/{taskResult.task_id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            {taskResult.title}
          </a>
        </TableBodyCell>
        <TableBodyCell>{taskResult.updated_at.toLocaleString()}</TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
