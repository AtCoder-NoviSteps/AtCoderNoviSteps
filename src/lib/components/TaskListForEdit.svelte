<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Button,
  } from 'flowbite-svelte';

  import type { Task } from '$lib/types/task';
  import { ATCODER_BASE_CONTEST_URL } from '$lib/constants/urls';
  import { getContestNameLabel } from '$lib/utils/contest';

  //gradeでソート済みのTaskのリストと、APIから取得したtasklistを表示する
  export let tasks: Task[];
  //APIから取得したリストで、データベースに追加していないTaskのリストにする
  export let importTasks: Task[];
</script>

<!-- TODO: 問題が多くなってきたら、ページネーションを導入する -->
<!-- TODO: 回答状況に応じて、フィルタリングできるようにする -->
To Import
<Table shadow hoverable={true} class="text-md">
  <TableHead class="text-md">
    <TableHeadCell class="w-1/4">コンテスト名</TableHeadCell>
    <TableHeadCell class="w-1/2">問題名</TableHeadCell>
    <TableHeadCell class="w-1/4"></TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each importTasks as importTask}
      <TableBodyRow height="40px">
        <TableBodyCell class="p-3">
          {getContestNameLabel(importTask.contest_id)}
        </TableBodyCell>
        <TableBodyCell>
          {importTask.title}
        </TableBodyCell>

        <TableBodyCell><Button>インポート</Button></TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
To Edit
<Table shadow hoverable={true} class="text-md">
  <TableHead class="text-md">
    <TableHeadCell class="w-1/4">コンテスト名</TableHeadCell>
    <TableHeadCell class="w-1/2">問題名</TableHeadCell>
    <TableHeadCell class="w-1/4"></TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each tasks as task}
      <TableBodyRow height="40px">
        <TableBodyCell class="p-3">
          <a
            href="{ATCODER_BASE_CONTEST_URL}/{task.contest_id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            target="_blank"
            rel="noreferrer"
          >
            {getContestNameLabel(task.contest_id)}
          </a>
        </TableBodyCell>
        <TableBodyCell>
          {task.title}
        </TableBodyCell>
        <TableBodyCell>
          <a
            href="/tasks/{task.task_id}"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            編集
          </a></TableBodyCell
        >
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
