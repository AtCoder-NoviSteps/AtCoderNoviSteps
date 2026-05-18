<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';

  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Button,
    Label,
  } from 'flowbite-svelte';

  import type { Contests } from '$lib/types/contest';
  import type { ContestTaskImportSource } from '$lib/clients';
  import { getContestNameLabel } from '$lib/utils/contest';
  import { newline } from '$lib/utils/newline';

  interface Props {
    importContests: Contests;
    source: ContestTaskImportSource;
    onImportSuccess: (contestId: string) => void;
    onImportError: (message: string) => void;
  }

  let { importContests, source, onImportSuccess, onImportError }: Props = $props();

  function makeImportHandler(contestId: string): SubmitFunction {
    return () =>
      async ({ result }) => {
        if (result.type === 'success' && (result.data as { success?: boolean })?.success) {
          onImportSuccess(contestId);
        } else if (result.type === 'failure') {
          onImportError('インポートに失敗しました。');
        }
      };
  }
</script>

<Table shadow hoverable={true} class="text-md" divClass="">
  <TableHead class="text-md bg-gray-100">
    <TableHeadCell class="w-1/8">コンテストID</TableHeadCell>
    <TableHeadCell class="w-1/3">コンテスト名</TableHeadCell>
    <TableHeadCell class="w-1/3">問題名</TableHeadCell>
    <TableHeadCell class="w-1/8"></TableHeadCell>
  </TableHead>
  <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
    {#each importContests as importContest (importContest.id)}
      <TableBodyRow>
        <TableBodyCell class="p-3">
          <Label>
            {#each newline(getContestNameLabel(importContest.id), 10) as line, i (i)}
              {line}<br />
            {/each}
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          <Label>
            {#each newline(importContest.title, 28) as line, i (i)}
              {line}<br />
            {/each}
          </Label>
        </TableBodyCell>
        <TableBodyCell>
          {#each importContest.tasks as importTask (importTask.id)}
            <li>{importTask.title}</li>
          {/each}
        </TableBodyCell>
        <TableBodyCell>
          <form method="POST" action="?/create" use:enhance={makeImportHandler(importContest.id)}>
            <input type="hidden" name="contest_id" value={importContest.id} />
            <input type="hidden" name="source" value={source} />
            <input type="hidden" name="tasks" value={JSON.stringify(importContest.tasks)} />
            <Button type="submit">インポート</Button>
          </form>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
