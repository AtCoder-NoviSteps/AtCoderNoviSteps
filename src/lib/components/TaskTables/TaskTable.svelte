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
  import type { ContestTableProvider } from '$lib/types/contest_table_provider';

  import TaskTableBodyCell from '$lib/components/TaskTables/TaskTableBodyCell.svelte';

  import { activeContestTypeStore } from '$lib/stores/active_contest_type.svelte';
  import {
    contestTableProviders,
    type ContestTableProviders,
  } from '$lib/utils/contest_table_provider';

  import { getBackgroundColorFrom } from '$lib/services/submission_status';

  interface Props {
    taskResults: TaskResults;
    isLoggedIn: boolean;
  }

  let { taskResults, isLoggedIn }: Props = $props();

  // Prepare contest table provider based on the active contest type.
  let activeContestType = $derived(activeContestTypeStore.get());

  // Note: This is necessary to ensure that the active contest type is updated correctly.
  function updateActiveContestType(type: ContestTableProviders): void {
    activeContestType = type;
    activeContestTypeStore.set(type);
  }

  let provider: ContestTableProvider = $derived(
    contestTableProviders[activeContestType as ContestTableProviders],
  );
  // Filter the task results based on the active contest type.
  let filteredTaskResults = $derived(provider.filter(taskResults));
  // Generate the task table based on the filtered task results.
  let taskTable: Record<string, Record<string, TaskResult>> = $derived(
    provider.generateTable(filteredTaskResults),
  );
  let taskTableHeaderIds: Array<string> = $derived(
    provider.getHeaderIdsForTask(filteredTaskResults),
  );
  let contestIds: Array<string> = $derived(provider.getContestRoundIds(filteredTaskResults));
  let title = $derived(provider.getMetadata().title);

  function getContestRoundLabel(provider: ContestTableProvider, contestId: string): string {
    return provider.getContestRoundLabel(contestId);
  }

  function getBodyCellClasses(contestId: string, taskIndex: string): string {
    const baseClasses = 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1';
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

  // Update task results dynamically.
  // Computational complexity of preparation table: O(N), where N is the number of task results.
  let taskResultsMap = $derived(() => {
    return taskResults.reduce((map: Map<string, TaskResult>, taskResult: TaskResult) => {
      if (!map.has(taskResult.task_id)) {
        map.set(taskResult.task_id, taskResult);
      }
      return map;
    }, new Map<string, TaskResult>());
  });

  let taskIndicesMap = $derived(() => {
    const indices = new Map<string, number>();

    taskResults.forEach((task, index) => {
      indices.set(task.task_id, index);
    });

    return indices;
  });

  function handleUpdateTaskResult(updatedTask: TaskResult): void {
    const map = taskResultsMap();

    if (map.has(updatedTask.task_id)) {
      map.set(updatedTask.task_id, updatedTask);
    }

    const index = taskIndicesMap().get(updatedTask.task_id);

    if (index !== undefined) {
      const newTaskResults = [...taskResults];
      newTaskResults[index] = updatedTask;
      taskResults = newTaskResults;
    }
  }
</script>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/button-group -->
<ButtonGroup class="m-4 contents-center">
  {#each Object.entries(contestTableProviders) as [type, config]}
    <Button
      onclick={() => updateActiveContestType(type as ContestTableProviders)}
      class={activeContestType === (type as ContestTableProviders)
        ? 'active-button-class text-primary-700 dark:!text-primary-500'
        : ''}
      aria-label={config.getMetadata().ariaLabel}
    >
      {config.getMetadata().buttonLabel}
    </Button>
  {/each}
</ButtonGroup>

<Heading tag="h2" class="text-2xl pb-3 text-gray-900 dark:text-white">
  {title}
</Heading>

<!-- TODO: ページネーションを実装 -->
<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/pages/TablePage/AtCoderRegularTable.tsx -->
<!-- https://github.com/birdou/atcoder-blogs/blob/main/app/atcoder-blogs-frontend/src/pages/BlogTablePage/BlogTablePage.tsx -->
<!-- https://tailwindcss.com/docs/position#sticky-positioning-elements -->
<div class="container w-full rounded-md border shadow-sm">
  <div class="w-full sticky top-0 z-20 border-b">
    <Table id="task-table" class="text-md table-fixed w-full" aria-label="Task table">
      <TableHead class="text-sm bg-gray-100">
        <TableHeadCell class="w-full xl:w-16 px-2 text-center" scope="col">Round</TableHeadCell>

        {#if taskTableHeaderIds.length}
          {#each taskTableHeaderIds as taskTableHeaderId}
            <TableHeadCell class="text-center" scope="col">
              {taskTableHeaderId}
            </TableHeadCell>
          {/each}
        {/if}
      </TableHead>
    </Table>
  </div>

  <div class="w-full overflow-auto max-h-[calc(80vh-56px)]">
    <Table id="task-table" class="text-md table-fixed w-full" aria-label="Task table">
      <TableBody class="divide-y">
        {#if contestIds.length && taskTableHeaderIds.length}
          {#each contestIds as contestId}
            <TableBodyRow class="flex flex-wrap xl:table-row">
              <TableBodyCell class="w-full xl:w-16 truncate px-2 py-2 text-center">
                {getContestRoundLabel(provider, contestId)}
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
                      onupdate={(updatedTask: TaskResult) => handleUpdateTaskResult(updatedTask)}
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
</div>
