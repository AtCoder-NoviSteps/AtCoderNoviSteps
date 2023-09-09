<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import type { Tasks } from '$lib/types/task';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import { submissionStatusLabels } from '$lib/types/submission';

  export let grade: string;
  export let tasks: Tasks;
</script>

<h2 class="text-xl mt-4 mb-2">{grade}</h2>

<!-- TODO: 「編集」ボタンを押したときに問題情報を更新できるようにする -->
<!-- TODO: 問題が多くなってきたら、ページネーションを導入する -->
<Table shadow class="text-md">
  <TableHead class="text-md">
    <TableHeadCell class="w-1/6">提出状況</TableHeadCell>
    <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
    <TableHeadCell class="w-1/2">問題名</TableHeadCell>
    <TableHeadCell class="w-1/6">
      <span class="sr-only">編集</span>
    </TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each tasks as task}
      <TableBodyRow>
        <TableBodyCell>{submissionStatusLabels[task.submission_status]}</TableBodyCell>
        <TableBodyCell>
          <a
            href="{ATCODER_BASE_CONTEST_URL}/{task.contest_id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            target="_blank"
            rel="noreferrer"
          >
            {task.contest_id.toUpperCase()}
          </a>
        </TableBodyCell>
        <TableBodyCell>
          <a
            href="/problems/{task.id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            {task.title}
          </a>
        </TableBodyCell>
        <TableBodyCell>編集</TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
