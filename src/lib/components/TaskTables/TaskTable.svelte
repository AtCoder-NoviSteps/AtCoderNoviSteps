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
  } from 'svelte-5-ui-lib';

  import type { TaskResults, TaskResult } from '$lib/types/task';
  import { ContestType } from '$lib/types/contest';

  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';
  import TaskTableBodyCell from '$lib/components/TaskTables/TaskTableBodyCell.svelte';

  import {
    type TaskResultsFilter,
    taskResultsForABCLatest20,
    taskResultsFromABC319Onwards,
    taskResultsFromABC212ToABC318,
  } from '$lib/utils/task_results_filter';

  import {
    type TaskTable,
    taskTableForABCLatest20,
    taskTableFromABC319Onwards,
    taskTableFromABC212ToABC318,
  } from '$lib/utils/task_table';

  import { getBackgroundColorFrom } from '$lib/services/submission_status';

  interface Props {
    taskResults: TaskResults;
    isLoggedIn: boolean;
  }

  let { taskResults, isLoggedIn }: Props = $props();

  // TODO: 任意のコンテスト種別に拡張
  let taskResultsFilter: TaskResultsFilter | null = taskResultsForABCLatest20(taskResults);

  let selectedTaskResults: TaskResults = $state(taskResultsFilter.run());

  let aTaskTable: TaskTable | null = $state(
    taskTableForABCLatest20(selectedTaskResults, ContestType.ABC),
  );

  let contestIds: Array<string> = $derived(aTaskTable.getContestRoundIds());

  let taskTableIndices: Array<string> = $derived(aTaskTable.getHeaderIdsForTask());
  let taskTable: Record<string, Record<string, TaskResult>> = $derived(aTaskTable.prepare());
  // FIXME: 他のコンポーネントと完全に重複しているので、コンポーネントとして切り出す。
  let updatingModal: UpdatingModal | null = null;

  // WHY: () => updatingModal.openModal(taskResult) だけだと、updatingModalがnullの可能性があるため。
  function openModal(taskResult: TaskResult): void {
    if (updatingModal) {
      updatingModal.openModal(taskResult);
    } else {
      console.error('Failed to initialize UpdatingModal component.');
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
<ButtonGroup class="m-4 contents-center">
  <Button
    onclick={() => (
      (taskResultsFilter = taskResultsForABCLatest20(taskResults)),
      (aTaskTable = taskTableForABCLatest20(selectedTaskResults, ContestType.ABC))
    )}
    aria-label="Filter contests from ABC212 onwards"
  >
    ABC Latest 20 rounds
  </Button>
  <Button
    onclick={() => (
      (taskResultsFilter = taskResultsFromABC319Onwards(taskResults)),
      (aTaskTable = taskTableFromABC319Onwards(selectedTaskResults, ContestType.ABC))
    )}
    aria-label="Filter contests from ABC319 onwards"
  >
    ABC319〜
  </Button>
  <Button
    onclick={() => (
      (taskResultsFilter = taskResultsFromABC212ToABC318(taskResults)),
      (aTaskTable = taskTableFromABC212ToABC318(selectedTaskResults, ContestType.ABC))
    )}
    aria-label="Filter contests from ABC319 onwards"
  >
    ABC212〜318
  </Button>
</ButtonGroup>

<!-- TODO: コンテスト種別に応じて動的に変更できるようにする -->
<Heading tag="h2" class="text-2xl pb-3 text-gray-900 dark:text-white">
  {aTaskTable?.getTitle()}
</Heading>

<!-- TODO: ページネーションを実装 -->
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

    <TableBody class="divide-y">
      {#if contestIds.length && taskTableIndices.length}
        {#each contestIds as contestId}
          <TableBodyRow class="flex flex-wrap xl:table-row">
            <TableBodyCell class="w-full xl:w-16 truncate px-2 py-2 text-center border">
              {aTaskTable?.getContestRoundLabel(contestId)}
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
                    onClick={() => openModal(taskTable[contestId][taskIndex])}
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
