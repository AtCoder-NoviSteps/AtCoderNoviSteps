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

  export let grade: string;
  export let taskResults: TaskResults;
</script>

<h2 class="text-xl mt-4 mb-2">{grade}</h2>

<!-- TODO: 「編集」ボタンを押したときに問題情報を更新できるようにする -->
<!-- TODO: 問題が多くなってきたら、ページネーションを導入する -->
<!-- TODO: 回答状況に応じて、フィルタリングできるようにする -->
<Table shadow hoverable={true} class="text-md">
  <TableHead class="text-md">
    <TableHeadCell class="w-1/6">提出状況</TableHeadCell>
    <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
    <TableHeadCell class="w-1/2">問題名</TableHeadCell>
    <TableHeadCell class="w-1/6">
      <span class="sr-only">編集</span>
    </TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each taskResults as taskResult}
      <TableBodyRow>
        <TableBodyCell class="p-3">
          <Img
            src="../../{taskResult.submission_status}.png"
            alt={taskResult.submission_status}
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
            {taskResult.contest_id.toUpperCase()}
          </a>
        </TableBodyCell>
        <TableBodyCell>
          <a
            href="/problems/{taskResult.id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            {taskResult.title}
          </a>
        </TableBodyCell>
        <TableBodyCell>編集</TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
