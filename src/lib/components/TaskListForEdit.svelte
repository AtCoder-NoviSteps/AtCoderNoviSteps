<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Button,
    Label,
    Input,
  } from 'flowbite-svelte';

  import type { Contests } from '$lib/types/contest';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { newline } from '$lib/utils/newline';

  //gradeでソート済みのTaskのリストと、APIから取得したtasklistを表示する
  //export let tasks: Task[];
  //APIから取得したリストで、データベースに追加していないTaskのリストにする
  export let importContests: Contests;
</script>

<!-- TODO: 問題が多くなってきたら、ページネーションを導入する -->
<!-- TODO: 回答状況に応じて、フィルタリングできるようにする -->
<Table shadow hoverable={true} class="text-md" divClass="">
  <TableHead class="text-md bg-gray-100">
    <TableHeadCell class="w-1/8">コンテストID</TableHeadCell>
    <TableHeadCell class="w-1/3">コンテスト名</TableHeadCell>
    <TableHeadCell class="w-1/3">問題名</TableHeadCell>
    <TableHeadCell class="w-1/8"></TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each importContests as importContest}
      {#if importContest.tasks.length > 0}
        <TableBodyRow height="40px">
          <TableBodyCell class="p-3">
            <Label>
              {#each newline(getContestNameLabel(importContest.id), 10) as line}
                {line}<br />
              {/each}
            </Label>
          </TableBodyCell>
          <TableBodyCell>
            <Label>
              {#each newline(importContest.title, 28) as line}
                {line}<br />
              {/each}
            </Label>
          </TableBodyCell>

          <TableBodyCell>
            {#each importContest.tasks as importTask}
              <li>{importTask.title}</li>
            {/each}
          </TableBodyCell>
          <TableBodyCell>
            <form method="POST" action="?/create">
              <Input size="md" type="hidden" name="contest_id" bind:value={importContest.id} />

              <Button type="submit">インポート</Button>
            </form>
          </TableBodyCell>
        </TableBodyRow>
      {/if}
    {/each}
  </TableBody>
</Table>
