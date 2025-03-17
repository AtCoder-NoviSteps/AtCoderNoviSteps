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

  import UpdatingModal from '$lib/components/SubmissionStatus/UpdatingModal.svelte';
  import TaskTableBodyCell from '$lib/components/TaskTables/TaskTableBodyCell.svelte';

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

  let activeContestType = $state<ContestTableProviders>('abcLatest20Rounds');

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
  {#each Object.entries(contestTableProviders) as [type, config]}
    <Button
      onclick={() => (activeContestType = type as ContestTableProviders)}
      class={activeContestType === type ? 'active-button-class' : ''}
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
<!-- TODO: ヘッダーを固定できるようにする。-->
<!-- HACK: Flowbite と tailwindcss の相性が悪いのかもしれない。tailwindcss のクラス指定、raw HTML & CSS を試したが、いずれも実現できず。 -->
<!-- See: -->
<!-- https://github.com/kenkoooo/AtCoderProblems/blob/master/atcoder-problems-frontend/src/pages/TablePage/AtCoderRegularTable.tsx -->
<!-- https://github.com/birdou/atcoder-blogs/blob/main/app/atcoder-blogs-frontend/src/pages/BlogTablePage/BlogTablePage.tsx -->
<!-- https://tailwindcss.com/docs/position#sticky-positioning-elements -->
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
