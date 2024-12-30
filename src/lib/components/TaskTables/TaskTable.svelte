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

  $: selectedTaskResults = filterTaskResultsByContestType(fromABC212_Onwards);
  $: contestNames = getContestNames(selectedTaskResults);
  $: headerNames = getTaskIndices(selectedTaskResults, ContestType.ABC);

  function filterTaskResultsByContestType(
    condition: (taskResult: TaskResult) => boolean,
  ): TaskResults {
    return taskResults.filter(condition);
  }

  function getContestNames(selectedTaskResults: TaskResults): Array<string> {
    const contestList = selectedTaskResults.map((taskResult: TaskResult) => taskResult.contest_id);
    return Array.from(new Set(contestList)).sort().reverse();
  }

  function getTaskIndices(
    selectedTaskResults: TaskResults,
    selectedContestType: ContestType,
  ): Array<string> {
    const headerList = selectedTaskResults.map((taskResult: TaskResult) =>
      getTaskTableHeaderName(selectedContestType, taskResult),
    );
    return Array.from(new Set(headerList)).sort();
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
  <Button on:click={() => filterTaskResultsByContestType(fromABC212_Onwards)}>ABC212〜</Button>
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
