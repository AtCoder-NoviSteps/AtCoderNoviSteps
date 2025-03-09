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
    type TaskTableGenerator,
    taskTableGeneratorForABCLatest20,
    taskTableGeneratorFromABC319Onwards,
    taskTableGeneratorFromABC212ToABC318,
  } from '$lib/utils/task_table_generator';

  import { getBackgroundColorFrom } from '$lib/services/submission_status';

  interface Props {
    taskResults: TaskResults;
    isLoggedIn: boolean;
  }

  let { taskResults, isLoggedIn }: Props = $props();

  // TODO: 任意のコンテスト種別を追加
  // TODO: コンテスト種別の並び順を決める
  const contestFilterConfigs = {
    abcLatest20Rounds: {
      filter: () => taskResultsForABCLatest20(taskResults),
      table: (results: TaskResults) => taskTableGeneratorForABCLatest20(results, ContestType.ABC),
      buttonLabel: 'ABC 最新 20 回',
      ariaLabel: 'Filter ABC latest 20 rounds',
    },
    abc319Onwards: {
      filter: () => taskResultsFromABC319Onwards(taskResults),
      table: (results: TaskResults) =>
        taskTableGeneratorFromABC319Onwards(results, ContestType.ABC),
      buttonLabel: 'ABC319 〜',
      ariaLabel: 'Filter contests from ABC 319 onwards',
    },
    abc212To318: {
      filter: () => taskResultsFromABC212ToABC318(taskResults),
      table: (results: TaskResults) =>
        taskTableGeneratorFromABC212ToABC318(results, ContestType.ABC),
      buttonLabel: 'ABC212 〜 318',
      ariaLabel: 'Filter contests from ABC 212 to ABC 318',
    },
  };

  type ContestTypeFilter = 'abcLatest20Rounds' | 'abc319Onwards' | 'abc212To318';

  let activeContestType = $state<ContestTypeFilter>('abcLatest20Rounds');

  // Select the task results based on the active contest type.
  let taskResultsFilter: TaskResultsFilter = $derived(
    contestFilterConfigs[activeContestType].filter(),
  );
  let selectedTaskResults: TaskResults = $derived(taskResultsFilter.run());

  // Generate the task table based on the selected task results.
  let taskTableGenerator: TaskTableGenerator = $derived(
    contestFilterConfigs[activeContestType].table(selectedTaskResults),
  );
  let taskTable: Record<string, Record<string, TaskResult>> = $derived(taskTableGenerator.run());
  let taskTableHeaderIds: Array<string> = $derived(taskTableGenerator.getHeaderIdsForTask());
  let contestIds: Array<string> = $derived(taskTableGenerator.getContestRoundIds());

  function getTaskTableTitle(taskTable: TaskTableGenerator): string {
    return taskTable.getTitle() ?? '';
  }

  function getContestRoundLabel(taskTable: TaskTableGenerator, contestId: string): string {
    return taskTable.getContestRoundLabel(contestId);
  }

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

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/button-group -->
<ButtonGroup class="m-4 contents-center">
  {#each Object.entries(contestFilterConfigs) as [type, config]}
    <Button
      onclick={() => (activeContestType = type as ContestTypeFilter)}
      class={activeContestType === type ? 'active-button-class' : ''}
      aria-label={config.ariaLabel}
    >
      {config.buttonLabel}
    </Button>
  {/each}
</ButtonGroup>

<Heading tag="h2" class="text-2xl pb-3 text-gray-900 dark:text-white">
  {getTaskTableTitle(taskTableGenerator)}
</Heading>

<!-- TODO: ページネーションを実装 -->
<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/pages/TablePage/AtCoderRegularTable.tsx -->
<!-- https://github.com/birdou/atcoder-blogs/blob/main/app/atcoder-blogs-frontend/src/pages/BlogTablePage/BlogTablePage.tsx -->
<div class="container w-full overflow-auto border rounded-md">
  <Table shadow id="task-table" class="text-md table-fixed" aria-label="Task table">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="w-full xl:w-16 px-2 text-center border" scope="col">
        Round
      </TableHeadCell>

      {#if taskTableHeaderIds.length}
        {#each taskTableHeaderIds as taskTableHeaderId}
          <TableHeadCell class="text-center border" scope="col">{taskTableHeaderId}</TableHeadCell>
        {/each}
      {/if}
    </TableHead>

    <TableBody class="divide-y">
      {#if contestIds.length && taskTableHeaderIds.length}
        {#each contestIds as contestId}
          <TableBodyRow class="flex flex-wrap xl:table-row">
            <TableBodyCell class="w-full xl:w-16 truncate px-2 py-2 text-center border">
              {getContestRoundLabel(taskTableGenerator, contestId)}
            </TableBodyCell>

            {#each taskTableHeaderIds as taskTableHeaderId}
              <TableBodyCell
                id={contestId + '-' + taskTableHeaderId}
                class={getBodyCellClasses(contestId, taskTableHeaderId)}
              >
                {#if taskTable[contestId][taskTableHeaderId]}
                  <TaskTableBodyCell
                    taskResult={taskTable[contestId][taskTableHeaderId]}
                    {isLoggedIn}
                    onClick={() => openModal(taskTable[contestId][taskTableHeaderId])}
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
