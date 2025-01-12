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

  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';
  import TaskTableBodyCell from '$lib/components/TaskTables/TaskTableBodyCell.svelte';

  import { classifyContest, getContestNameLabel } from '$lib/utils/contest';
  import { getTaskTableHeaderName } from '$lib/utils/task';
  import { getBackgroundColorFrom } from '$lib/services/submission_status';

  export let taskResults: TaskResults;
  export let isLoggedIn: boolean;

  let selectedTaskResults: TaskResults;
  let contestIds: Array<string>;
  let taskTableIndices: Array<string>;
  let taskTable: Record<string, Record<string, TaskResult>>;
  let updatingModal: UpdatingModal;

  // TODO: 任意のコンテスト種別に拡張
  $: selectedTaskResults = filterTaskResultsByContestType(taskResults, fromABC212_Onwards);
  $: contestIds = getContestIds(selectedTaskResults);
  $: taskTableIndices = getTaskTableIndices(selectedTaskResults, ContestType.ABC);
  $: taskTable = prepareTaskTable(selectedTaskResults, ContestType.ABC);

  function filterTaskResultsByContestType(
    taskResults: TaskResults,
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

  /**
   * Prepare a table for task and submission statuses.
   *
   * Computational complexity of preparation table: O(N), where N is the number of task results.
   * Computational complexity of accessing table: O(1).
   *
   * @param selectedTaskResults Task results to be shown in the table.
   * @param selectedContestType Contest type of the task results.
   * @returns A table for task and submission statuses.
   */
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

  function getContestNameLabelForTaskTable(contestId: string): string {
    let contestNameLabel = getContestNameLabel(contestId);
    const contestType = classifyContest(contestId);

    switch (contestType) {
      case ContestType.ABC:
        return contestNameLabel.replace('ABC ', '');
      // TODO: Add cases for other contest types.
      default:
        return contestNameLabel;
    }
  }

  function getBodyCellClasses(contestId: string, taskIndex: string): string {
    const baseClasses = 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1 border';
    const backgroundColor = getBackgroundColor(taskTable[contestId][taskIndex]);

    return `${baseClasses} ${backgroundColor}`;
  }

  function getBackgroundColor(taskResult: TaskResult): string {
    const statusName = taskResult?.status_name;

    if (taskResult && statusName !== 'ns') {
      return getBackgroundColorFrom(statusName);
    }

    return '';
  }
</script>

<!-- TODO: コンテスト種別のボタンの並び順を決める -->
<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/button-group -->
<ButtonGroup class="m-4 contents-center" aria-label="Contest filter options">
  <Button
    on:click={() => filterTaskResultsByContestType(taskResults, fromABC212_Onwards)}
    aria-label="Filter contests from ABC212 onwards"
  >
    ABC212〜
  </Button>
</ButtonGroup>

<!-- TODO: コンテスト種別に応じて動的に変更できるようにする -->
<Heading tag="h2" class="text-2xl pb-3 text-gray-900 dark:text-white">
  {'AtCoder Beginners Contest 212 〜'}
</Heading>

<!-- TODO: ページネーションを実装 -->
<!-- TODO: ページネーションライブラリを導入するには、Svelte v4 から v5 へのアップデートが必要 -->
<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/pages/TablePage/AtCoderRegularTable.tsx -->
<!-- https://github.com/birdou/atcoder-blogs/blob/main/app/atcoder-blogs-frontend/src/pages/BlogTablePage/BlogTablePage.tsx -->
<div class="container w-full overflow-auto border rounded-md">
  <Table shadow id="task-table" class="text-md table-fixed" aria-label="Task table">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="w-full xl:w-16 px-2 text-center border" scope="col">Round</TableHeadCell
      >

      {#if taskTableIndices.length}
        {#each taskTableIndices as taskTableIndex}
          <TableHeadCell class="text-center border" scope="col">{taskTableIndex}</TableHeadCell>
        {/each}
      {/if}
    </TableHead>

    <TableBody tableBodyClass="divide-y">
      {#if contestIds.length && taskTableIndices.length}
        {#each contestIds as contestId}
          <TableBodyRow class="flex flex-wrap xl:table-row">
            <TableBodyCell class="w-full xl:w-16 truncate px-2 py-2 text-center border">
              <!-- FIXME: コンテスト種別に合わせて修正できるようにする -->
              {getContestNameLabelForTaskTable(contestId)}
            </TableBodyCell>

            {#each taskTableIndices as taskIndex}
              <TableBodyCell
                id={contestId + '-' + taskIndex}
                class={getBodyCellClasses(contestId, taskIndex)}
              >
                {#if taskTable[contestId][taskIndex]}
                  <TaskTableBodyCell
                    taskResult={taskTable[contestId][taskIndex]}
                    {isLoggedIn}
                    {updatingModal}
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

<UpdatingModal bind:this={updatingModal} {isLoggedIn} />
