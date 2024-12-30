<script lang="ts">
  import {
    ButtonGroup,
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import type { TaskResults, TaskResult } from '$lib/types/task';
  import { ContestType } from '$lib/types/contest';
  import { classifyContest, getContestNameLabel } from '$lib/utils/contest';
  import { getTaskTableHeaderName } from '$lib/utils/task';
  export let taskResults: TaskResults;

  let selectedContestType: ContestType;
  let selectedTaskResults: TaskResults | null = null;
  let contestNames: Array<string> | null = null;
  let headerNames: Array<string> | null = null;

  $: selectedTaskResults = taskResults.filter(fromABC212_Onwards);

  // FIXME: 冗長な記述をリファクタリング
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const handleClick = (event: any) => {
    selectedContestType = event.target.value;
    selectedTaskResults = taskResults.filter(
      (taskResult: TaskResult) => classifyContest(taskResult.contest_id) === selectedContestType,
    );

    const contestList = selectedTaskResults.map((taskResult: TaskResult) => taskResult.contest_id);
    contestNames = Array.from(new Set(contestList)).sort().reverse();

    const headerList = selectedTaskResults.map((taskResult: TaskResult) =>
      getTaskTableHeaderName(selectedContestType, taskResult),
    );

    headerNames = Array.from(new Set(headerList)).sort();
  };

  function filterByContestType(condition: (taskResult: TaskResult) => boolean): void {
    selectedTaskResults = taskResults.filter(condition);
  }

  // Note:
  // Before and from ABC212 onwards, the number and tendency of tasks are very different.
  const fromABC212_Onwards = (taskResult: TaskResult) =>
    classifyContest(taskResult.contest_id) === ContestType.ABC && taskResult.contest_id >= 'abc212';
</script>

<!-- TODO: ボタンの並び順を決める -->
<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/button-group -->
<ButtonGroup class="m-4 contents-center">
  <Button on:click={() => filterByContestType(fromABC212_Onwards)}>ABC212〜</Button>
</ButtonGroup>

<!-- TODO: 該当する問題をテーブル形式で表示する -->
<h2 class="dark:text-gray-100">AtCoder Beginners Contest</h2>

{#if selectedTaskResults !== null && selectedTaskResults.length}
  <p>問題数: {selectedTaskResults.length}</p>
{/if}

<!-- TODO: ABC212〜、〜ABC211で分離 -->
<!-- FIXME: nullの状態のときは表示しないようにする -->
<Table shadow hoverable={true}>
  <TableHead>
    <TableHeadCell>Contest</TableHeadCell>
    {#if headerNames !== null && headerNames.length}
      {#each headerNames as headerName}
        <TableHeadCell>{headerName}</TableHeadCell>
      {/each}
    {/if}
  </TableHead>
  <TableBody tableBodyClass="divede-y">
    {#if contestNames !== null && contestNames.length}
      <!-- HACK: for ABC only. -->
      {#if selectedContestType === ContestType.ABC}
        {#each contestNames as contestName}
          <TableBodyRow>
            <TableBodyCell>{getContestNameLabel(contestName)}</TableBodyCell>
          </TableBodyRow>
        {/each}
      {/if}
    {/if}
  </TableBody>
</Table>
