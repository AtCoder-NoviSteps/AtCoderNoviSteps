<script lang="ts">
  import { writable } from 'svelte/store';
  import { createTable, Render, Subscribe } from 'svelte-headless-table';
  import { Label } from 'flowbite-svelte';
  import * as Table from '$lib/components/ui/table';

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import type { WorkBookTaskBase, WorkBookTaskCreate, WorkBookTaskEdit } from '$lib/types/workbook';
  import { getContestUrl, getContestNameLabel } from '$lib/utils/contest';
  import { taskUrl } from '$lib/utils/task';

  export let workBookTasks = [] as WorkBookTaskBase[];
  export let workBookTasksForTable = [] as WorkBookTaskCreate[] | WorkBookTaskEdit[];

  const table = createTable(writable(workBookTasksForTable));
  const columns = table.createColumns([
    table.column({
      accessor: 'contestId',
      header: 'コンテスト名',
    }),
    table.column({
      accessor: 'taskId',
      header: '問題名',
    }),
    table.column({
      accessor: (id) => id,
      header: '',
      id: 'deleteTask',
    }),
  ]);
  const { headerRows, pageRows, tableAttrs, tableBodyAttrs } = table.createViewModel(columns);

  const getContestId = (rowId: string) => {
    return workBookTasksForTable[Number(rowId)].contestId;
  };
  const getTask = (rowId: string) => {
    return workBookTasksForTable[Number(rowId)];
  };
  const getTaskId = (rowId: string) => {
    return workBookTasksForTable[Number(rowId)].taskId;
  };
  const getTaskTitle = (rowId: string) => {
    return workBookTasksForTable[Number(rowId)].title;
  };

  function removeWorkBookTask(task: WorkBookTaskCreate | WorkBookTaskEdit) {
    workBookTasks = workBookTasks.filter((workBookTask) => workBookTask.taskId !== task.taskId);
    workBookTasksForTable = workBookTasksForTable.filter(
      (workBookTask) => workBookTask.taskId !== task.taskId,
    );
  }
</script>

<Label class="space-y-2">
  <span>問題一覧</span>
</Label>

{#if workBookTasksForTable.length > 0}
  <!-- TODO: 編集にリンクを付ける -->
  <!-- TODO: 削除にゴミ箱マークを付ける -->
  <div class="overflow-auto rounded-md border">
    <Table.Root {...$tableAttrs}>
      <Table.Header>
        {#each $headerRows as headerRow}
          <Subscribe rowAttrs={headerRow.attrs()}>
            <Table.Row>
              {#each headerRow.cells as cell (cell.id)}
                <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
                  <Table.Head {...attrs}>
                    <Render of={cell.render()} />
                  </Table.Head>
                </Subscribe>
              {/each}
            </Table.Row>
          </Subscribe>
        {/each}
      </Table.Header>
      <Table.Body {...$tableBodyAttrs}>
        {#each $pageRows as row (row.id)}
          <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
            {#if getTask(row.id)}
              <Table.Row {...rowAttrs}>
                {#each row.cells as cell (cell.id)}
                  <Subscribe attrs={cell.attrs()} let:attrs>
                    {#if cell.id === 'contestId'}
                      <Table.Cell {...attrs} class="min-w-[120px] max-w-[150px] truncate">
                        <ExternalLinkWrapper
                          url={getContestUrl(getContestId(row.id))}
                          description={getContestNameLabel(getContestId(row.id))}
                        >
                          <Render of={cell.render()} />
                        </ExternalLinkWrapper>
                      </Table.Cell>
                    {:else if cell.id === 'taskId'}
                      <Table.Cell {...attrs} class="min-w-[240px] truncate">
                        <ExternalLinkWrapper
                          url={taskUrl(getContestId(row.id), getTaskId(row.id))}
                          description={getTaskTitle(row.id)}
                        >
                          <div class="truncate">
                            <Render of={cell.render()} />
                          </div>
                        </ExternalLinkWrapper>
                      </Table.Cell>
                    {:else if cell.id === 'deleteTask'}
                      <Table.Cell
                        {...attrs}
                        on:click={() => removeWorkBookTask(getTask(row.id))}
                        class="min-w-[72px]"
                      >
                        {'削除'}
                      </Table.Cell>
                    {/if}
                  </Subscribe>
                {/each}
              </Table.Row>
            {/if}
          </Subscribe>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
{:else}
  問題を1問以上登録してください。
{/if}
