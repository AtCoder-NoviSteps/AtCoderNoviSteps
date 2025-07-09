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
  import type {
    ContestTableProvider,
    ContestTableDisplayConfig,
  } from '$lib/types/contest_table_provider';

  import TaskTableBodyCell from '$lib/components/TaskTables/TaskTableBodyCell.svelte';

  import { activeContestTypeStore } from '$lib/stores/active_contest_type.svelte';
  import {
    contestTableProviderGroups,
    type ContestTableProviderGroup,
    type ContestTableProviderGroups,
  } from '$lib/utils/contest_table_provider';

  import { getBackgroundColorFrom } from '$lib/services/submission_status';

  interface Props {
    taskResults: TaskResults;
    isLoggedIn: boolean;
  }

  let { taskResults, isLoggedIn }: Props = $props();

  // Prepare contest table provider based on the active contest type.
  let activeContestType: ContestTableProviderGroups = $derived(activeContestTypeStore.get());

  // Note: This is necessary to ensure that the active contest type is updated correctly.
  function updateActiveContestType(type: ContestTableProviderGroups): void {
    activeContestType = type;
    activeContestTypeStore.set(type);
  }

  let providerGroups: ContestTableProviderGroup = $derived(
    contestTableProviderGroups[activeContestType as ContestTableProviderGroups],
  );
  let providers = $derived(providerGroups.getAllProviders());

  interface ProviderData {
    filteredTaskResults: TaskResults;
    innerTaskTable: Record<string, Record<string, TaskResult>>;
    headerIds: Array<string>;
    contestIds: Array<string>;
    metadata: any;
    displayConfig: ContestTableDisplayConfig;
  }

  let contestTableMaps = $derived(() => prepareContestTablesMap(providers));

  function prepareContestTablesMap(providers: ContestTableProvider[]): Map<string, ProviderData> {
    const map = new Map<string, ProviderData>();

    for (const provider of providers) {
      const abbreviationName = provider.getMetadata().abbreviationName;
      const contestTable = prepareContestTable(provider);

      if (contestTable) {
        map.set(abbreviationName, contestTable);
      }
    }

    return map;
  }

  function prepareContestTable(provider: ContestTableProvider): ProviderData | null {
    const filteredTaskResults = provider.filter(taskResults);

    if (filteredTaskResults.length === 0) {
      return null;
    }

    return {
      filteredTaskResults: filteredTaskResults,
      innerTaskTable: provider.generateTable(filteredTaskResults),
      headerIds: provider.getHeaderIdsForTask(filteredTaskResults),
      contestIds: provider.getContestRoundIds(filteredTaskResults),
      metadata: provider.getMetadata(),
      displayConfig: provider.getDisplayConfig(),
    };
  }

  function getTaskTable(abbreviationName: string) {
    return contestTableMaps().get(abbreviationName);
  }

  function getContestRoundLabel(provider: ContestTableProvider, contestId: string): string {
    return provider.getContestRoundLabel(contestId);
  }

  // More than 8 columns will wrap to the next line to align with ABC212 〜 ABC318 (8 tasks per contest).
  function getBodyRowClasses(totalColumns: number): string {
    return totalColumns > 8 ? 'flex flex-wrap' : 'flex flex-wrap xl:table-row';
  }

  function getBodyCellClasses(taskResult: TaskResult, totalColumns: number): string {
    const baseClasses = 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1';
    const additionalClasses = totalColumns > 8 ? '2xl:w-1/7 py-2' : '';
    const backgroundColor = getBackgroundColor(taskResult);

    return `${baseClasses} ${additionalClasses} ${backgroundColor}`;
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
  {#each Object.entries(contestTableProviderGroups) as [type, config]}
    <Button
      onclick={() => updateActiveContestType(type as ContestTableProviderGroups)}
      class={activeContestType === (type as ContestTableProviderGroups)
        ? 'active-button-class text-primary-700 dark:!text-primary-500'
        : ''}
      aria-label={config.getMetadata().ariaLabel}
    >
      {config.getMetadata().buttonLabel}
    </Button>
  {/each}
</ButtonGroup>

<!-- TODO: ページネーションを実装 -->
<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/pages/TablePage/AtCoderRegularTable.tsx -->
<!-- https://github.com/birdou/atcoder-blogs/blob/main/app/atcoder-blogs-frontend/src/pages/BlogTablePage/BlogTablePage.tsx -->
<!-- https://tailwindcss.com/docs/position#sticky-positioning-elements -->
{#each providers as provider}
  {@const metadata = provider.getMetadata()}
  {@const contestTable = getTaskTable(metadata.abbreviationName)}

  <!-- Title -->
  <Heading tag="h2" class="text-2xl pb-3 text-gray-900 dark:text-white">
    {metadata.title}
  </Heading>

  <div
    class="container w-full rounded-md border border-gray-200 dark:border-gray-100 shadow-sm mb-6 overflow-hidden"
  >
    <!-- Table header -->
    {#if contestTable && contestTable.displayConfig.isShownHeader}
      <div class="w-full sticky top-0 z-20 border-b border-gray-200 dark:border-gray-100">
        <Table id="task-table" class="text-md table-fixed w-full" aria-label="Task table">
          <TableHead class="text-sm border-gray-200 dark:border-gray-100">
            <TableHeadCell class="w-full xl:w-16 px-2 text-center" scope="col">Round</TableHeadCell>

            {#if contestTable.headerIds}
              {#each contestTable.headerIds as taskTableHeaderId}
                <TableHeadCell class="text-center" scope="col">
                  {taskTableHeaderId}
                </TableHeadCell>
              {/each}
            {/if}
          </TableHead>
        </Table>
      </div>
    {/if}

    <!-- Table body -->
    <div class="w-full overflow-auto max-h-[calc(80vh-56px)] bg-white dark:bg-gray-900">
      <Table id="task-table" class="text-md table-fixed w-full" aria-label="Task table">
        <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#if contestTable && contestTable.contestIds && contestTable.headerIds}
            {@const totalColumns = contestTable.headerIds.length}

            {#each contestTable.contestIds as contestId}
              <TableBodyRow class={getBodyRowClasses(totalColumns)}>
                {#if contestTable.displayConfig.isShownRoundLabel}
                  <TableBodyCell
                    class="w-full xl:w-16 truncate px-2 py-2 text-center bg-gray-50 dark:bg-gray-800"
                  >
                    {getContestRoundLabel(provider, contestId)}
                  </TableBodyCell>
                {/if}

                {#each contestTable.headerIds as taskTableHeaderId}
                  {@const taskResult = contestTable.innerTaskTable[contestId][taskTableHeaderId]}

                  <TableBodyCell
                    id={contestId + '-' + taskTableHeaderId}
                    class={getBodyCellClasses(taskResult, totalColumns)}
                  >
                    {#if taskResult}
                      <TaskTableBodyCell
                        {taskResult}
                        {isLoggedIn}
                        isShownTaskIndex={contestTable.displayConfig.isShownTaskIndex}
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
{/each}
