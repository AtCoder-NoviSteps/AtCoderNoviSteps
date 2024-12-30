<script lang="ts">
  import {
    Heading,
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

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';

  import { classifyContest, getContestNameLabel } from '$lib/utils/contest';
  import { getTaskTableHeaderName, getTaskUrl, removeTaskIndexFromTitle } from '$lib/utils/task';

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

<!-- TODO: コンテスト種別に応じて動的に変更できるようにする -->
<Heading tag="h2" class="text-2xl pb-3 text-gray-900 dark:text-white">
  {'AtCoder Beginners Contest'}
</Heading>

<!-- TODO: ページネーションを実装 -->
<div class="overflow-auto rounded-md border">
  <Table shadow class="text-md">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell>Round</TableHeadCell>

      {#if taskTableIndices.length}
        {#each taskTableIndices as taskIndex}
          <TableHeadCell>{taskIndex}</TableHeadCell>
        {/each}
      {/if}
    </TableHead>

    <TableBody tableBodyClass="divede-y">
      {#if contestIds.length && taskTableIndices.length}
        {#each contestIds as contestId}
          <TableBodyRow>
            <TableBodyCell>{getContestNameLabel(contestId)}</TableBodyCell>

            {#each taskTableIndices as taskIndex}
              <TableBodyCell>
                {#if taskTable[contestId][taskIndex]}
                  <ExternalLinkWrapper
                    url={getTaskUrl(contestId, taskTable[contestId][taskIndex].task_id)}
                    description={removeTaskIndexFromTitle(
                      taskTable[contestId][taskIndex].title,
                      taskTable[contestId][taskIndex].task_table_index,
                    )}
                    textSize="xs:text-md"
                    textColorInDarkMode="dark:text-gray-300"
                  />
                {/if}
              </TableBodyCell>
            {/each}
          </TableBodyRow>
        {/each}
      {/if}
    </TableBody>
  </Table>
</div>
