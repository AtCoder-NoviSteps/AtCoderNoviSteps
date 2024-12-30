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

  let selectedTaskResults: TaskResults;
  let contestIds: Array<string>;
  let taskTableIndices: Array<string>;
  let taskTable: Record<string, Record<string, TaskResult>>;

  // TODO: 任意のコンテスト種別に拡張
  $: selectedTaskResults = filterTaskResultsByContestType(fromABC212_Onwards);
  $: contestIds = getContestIds(selectedTaskResults);
  $: taskTableIndices = getTaskTableIndices(selectedTaskResults, ContestType.ABC);
  $: taskTable = prepareTaskTable(selectedTaskResults, ContestType.ABC);

  function filterTaskResultsByContestType(
    condition: (taskResult: TaskResult) => boolean,
  ): TaskResults {
    return taskResults.filter(condition);
  }

  // Note:
  // Before and from ABC212 onwards, the number and tendency of tasks are very different.
  const fromABC212_Onwards = (taskResult: TaskResult) =>
    classifyContest(taskResult.contest_id) === ContestType.ABC && taskResult.contest_id >= 'abc212';

  function getContestIds(selectedTaskResults: TaskResults): Array<string> {
    const contestList = selectedTaskResults.map((taskResult: TaskResult) => taskResult.contest_id);
    return Array.from(new Set(contestList)).sort().reverse();
  }

  function getTaskTableIndices(
    selectedTaskResults: TaskResults,
    selectedContestType: ContestType,
  ): Array<string> {
    const headerList = selectedTaskResults.map((taskResult: TaskResult) =>
      getTaskTableHeaderName(selectedContestType, taskResult),
    );
    return Array.from(new Set(headerList)).sort();
  }

  function prepareTaskTable(
    selectedTaskResults: TaskResults,
    selectedContestType: ContestType,
  ): Record<string, Record<string, TaskResult>> {
    const table: Record<string, Record<string, TaskResult>> = {};

    selectedTaskResults.forEach((taskResult: TaskResult) => {
      const contestId = taskResult.contest_id;
      const taskTableIndex = getTaskTableHeaderName(selectedContestType, taskResult);

      if (!table[contestId]) {
        table[contestId] = {};
      }

      table[contestId][taskTableIndex] = taskResult;
    });

    return table;
  }
</script>

<!-- TODO: コンテスト種別のボタンの並び順を決める -->
<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/button-group -->
<ButtonGroup class="m-4 contents-center">
  <Button on:click={() => filterTaskResultsByContestType(fromABC212_Onwards)}>ABC212〜</Button>
</ButtonGroup>

<!-- TODO: コンテスト種別に応じて変更できるようにする -->
<h2 class="dark:text-gray-100">AtCoder Beginners Contest</h2>

<!-- TODO: ページネーションを実装 -->
<Table shadow>
  <TableHead>
    <TableHeadCell>Round</TableHeadCell>

    {#if taskTableIndices.length}
      {#each taskTableIndices as taskIndex}
        <TableHeadCell>{taskIndex}</TableHeadCell>
      {/each}
    {/if}
  </TableHead>

  <TableBody tableBodyClass="divede-y">
    {#if contestIds.length && taskTableIndices.length}
      {#each contestIds as contestName}
        <TableBodyRow>
          <TableBodyCell>{getContestNameLabel(contestName)}</TableBodyCell>

          {#each taskTableIndices as taskIndex}
            <TableBodyCell>
              {#if taskTable[contestName][taskIndex]}
                {taskTable[contestName][taskIndex].title}
                <!-- <a
                  href={`https://atcoder.jp/contests/${contestName}/tasks/${taskIndex}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {contestIdAndTaskIndexTable[contestName][taskIndex].task_name}
                </a> -->
              {/if}
            </TableBodyCell>
          {/each}
        </TableBodyRow>
      {/each}
    {/if}
  </TableBody>
</Table>
