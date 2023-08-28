<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  export let data;

  let tasks = data.tasks;
  let tasks10Kyu = tasks.filter((task) => task.grade === '10Kyu');
</script>

<!-- TODO: Add styles -->
<!-- FIXME: テーブルのフォントをやや大きく -->
<!-- FIXME: タイトルのフォントをやや大きく -->
<h1>Problems</h1>

<!-- TODO: 他の級・段も表示できるように -->
<!-- TODO: Extract a component. -->
<h2>10級</h2>
<div>
  <Table shadow>
    <TableHead>
      <TableHeadCell>提出状況</TableHeadCell>
      <TableHeadCell>コンテスト名</TableHeadCell>
      <TableHeadCell>問題名</TableHeadCell>
      <TableHeadCell>
        <span class="sr-only">編集</span>
      </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each tasks10Kyu as task}
        <TableBodyRow>
          <TableBodyCell>{task.submission_result}</TableBodyCell>
          <TableBodyCell>{task.contest_id.toUpperCase()}</TableBodyCell>
          <TableBodyCell>{task.title}</TableBodyCell>
          <TableBodyCell>編集</TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
