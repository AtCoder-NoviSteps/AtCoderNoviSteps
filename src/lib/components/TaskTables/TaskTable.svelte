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
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import IconForUpdating from '$lib/components/SubmissionStatus/IconForUpdating.svelte';

  import { classifyContest, getContestNameLabel } from '$lib/utils/contest';
  import { getTaskTableHeaderName, getTaskUrl, removeTaskIndexFromTitle } from '$lib/utils/task';
  import { getBackgroundColorFrom } from '$lib/services/submission_status';

  export let taskResults: TaskResults;
  export let isLoggedIn: boolean;

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
<ButtonGroup class="m-4 contents-center">
  <Button on:click={() => filterTaskResultsByContestType(fromABC212_Onwards)}>ABC212〜</Button>
</ButtonGroup>

<!-- TODO: コンテスト種別に応じて動的に変更できるようにする -->
<Heading tag="h2" class="text-2xl pb-3 text-gray-900 dark:text-white">
  {'AtCoder Beginners Contest 212 〜'}
</Heading>

<!-- TODO: ページネーションを実装 -->
<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/pages/TablePage/AtCoderRegularTable.tsx -->
<!-- https://github.com/birdou/atcoder-blogs/blob/main/app/atcoder-blogs-frontend/src/pages/BlogTablePage/BlogTablePage.tsx -->
<div class="container w-full overflow-auto border rounded-md">
  <Table shadow id="task-table" class="text-md table-fixed" aria-label="Task table">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="w-16 px-2 text-center border">Round</TableHeadCell>

      {#if taskTableIndices.length}
        {#each taskTableIndices as taskTableIndex}
          <TableHeadCell class="text-center border">{taskTableIndex}</TableHeadCell>
        {/each}
      {/if}
    </TableHead>

    <TableBody tableBodyClass="divede-y">
      {#if contestIds.length && taskTableIndices.length}
        {#each contestIds as contestId}
          <TableBodyRow>
            <TableBodyCell class="w-16 truncate px-2 py-2 text-center border">
              <!-- FIXME: コンテスト種別に合わせて修正できるようにする -->
              {getContestNameLabel(contestId).replace('ABC ', '')}
            </TableBodyCell>

            {#each taskTableIndices as taskIndex}
              <TableBodyCell
                class="px-2 py-2 border {getBackgroundColor(taskTable[contestId][taskIndex])}"
              >
                {#if taskTable[contestId][taskIndex]}
                  <!-- TODO: コンポーネントとして切り出す -->
                  <!-- Task name and URL -->
                  <div class="text-left text-lg">
                    <ExternalLinkWrapper
                      url={getTaskUrl(contestId, taskTable[contestId][taskIndex].task_id)}
                      description={removeTaskIndexFromTitle(
                        taskTable[contestId][taskIndex].title,
                        taskTable[contestId][taskIndex].task_table_index,
                      )}
                      textSize="xs:text-md"
                      textColorInDarkMode="dark:text-gray-300"
                      textOverflow="min-w-[60px] max-w-[132px]"
                      iconSize={0}
                    />
                  </div>

                  <!-- Grade -->
                  <div class="flex items-center justify-center py-2">
                    <GradeLabel
                      taskGrade={taskTable[contestId][taskIndex].grade}
                      defaultPadding={0.5}
                      defaultWidth={8}
                    />
                  </div>

                  <!-- Submission updater and links of task detail page -->
                  <div class="flex items-center justify-between">
                    <div class="flex-1 text-center">
                      <IconForUpdating {isLoggedIn} />
                    </div>

                    <!-- TODO: Add link of detailed page. -->
                    <div class="flex-1 text-center text-sm">
                      {'詳細'}
                    </div>
                  </div>
                {/if}
              </TableBodyCell>
            {/each}
          </TableBodyRow>
        {/each}
      {/if}
    </TableBody>
  </Table>
</div>
