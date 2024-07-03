<script lang="ts">
  import { writable } from 'svelte/store';
  import { createTable, Render, Subscribe } from 'svelte-headless-table';
  import { Breadcrumb, BreadcrumbItem, Label } from 'flowbite-svelte';

  import * as Table from '$lib/components/ui/table';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import WorkBookInputFields from '$lib/components/WorkBooks/WorkBookInputFields.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';

  import { getContestUrl, getContestIdFrom, getContestNameFrom } from '$lib/utils/contest';
  import { taskUrl, getTaskName } from '$lib/utils/task';
  import type { WorkBookTaskBase } from '$lib/types/workbook';

  export let data;

  let workBook = data.workBook;
  let workBookTasks: WorkBookTaskBase[] = workBook.workBookTasks;
  let tasks = data.tasks; // workBookTasksのtaskIdから問題情報を取得

  const getTaskId = (rowId: string) => {
    return workBookTasks[Number(rowId)].taskId;
  };

  const table = createTable(writable(workBookTasks));
  // See:
  // https://svelte-headless-table.bryanmylee.com/docs/api/create-columns
  const columns = table.createColumns([
    table.column({
      accessor: (id) => id, // TODO: 回答状況をリアクティブに更新できるようにする
      header: '回答',
      id: 'submissionStatus',
    }),
    table.column({
      accessor: (row) => getContestNameFrom(tasks, row.taskId), // コンテスト名は、taskIdが一意であることを利用して取得
      header: 'コンテスト名',
      id: 'contestName',
    }),
    table.column({
      accessor: (row) => getTaskName(tasks, row.taskId),
      header: '問題名',
      id: 'taskName',
    }),
  ]);
  const { headerRows, pageRows, tableAttrs, tableBodyAttrs } = table.createViewModel(columns);
</script>

<div class="container mx-auto w-5/6 space-y-4">
  <HeadingOne title="問題集の詳細" />

  <Breadcrumb aria-label="">
    <BreadcrumbItem href="/workbooks" home>問題集一覧</BreadcrumbItem>
    <BreadcrumbItem>
      <div class="min-w-[96px] max-w-[120px] truncate">
        {workBook.title}
      </div>
    </BreadcrumbItem>
  </Breadcrumb>

  <WorkBookInputFields
    authorId={workBook.authorId}
    workBookTitle={workBook.title}
    description={workBook.description}
    isPublished={workBook.isPublished}
    isOfficial={workBook.isOfficial}
    workBookType={workBook.workBookType}
    isAdmin={data.loggedInAsAdmin}
    isEditable={false}
  />

  <!-- 問題一覧 -->
  <!-- TODO: コンポーネントとして切り出す -->
  <!-- TODO: 問題一覧ページのコンポーネントを再利用する -->
  <Label class="space-y-2">
    <span>問題一覧</span>
  </Label>

  <!-- TODO: 回答状況を更新できるようにする -->
  <!-- FIXME: 列の幅は暫定値なので、微調整が必要 -->
  {#if workBookTasks.length >= 1}
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
              <Table.Row {...rowAttrs}>
                {#each row.cells as cell (cell.id)}
                  <Subscribe attrs={cell.attrs()} let:attrs>
                    {#if cell.id === 'submissionStatus'}
                      <Table.Cell {...attrs} class="min-w-[96px] max-w-[120px]">
                        {'準備中'}
                      </Table.Cell>
                    {:else if cell.id === 'contestName'}
                      <Table.Cell {...attrs} class="min-w-[120px] max-w-[150px] truncate">
                        <ExternalLinkWrapper
                          url={getContestUrl(getContestIdFrom(tasks, getTaskId(row.id)))}
                          description={getContestNameFrom(tasks, getTaskId(row.id))}
                        >
                          <div class="truncate">
                            <Render of={cell.render()} />
                          </div>
                        </ExternalLinkWrapper>
                      </Table.Cell>
                    {:else if cell.id === 'taskName'}
                      <Table.Cell {...attrs} class="min-w-[240px] truncate">
                        <ExternalLinkWrapper
                          url={taskUrl(
                            getContestIdFrom(tasks, getTaskId(row.id)),
                            getTaskId(row.id),
                          )}
                          description={getTaskName(tasks, getTaskId(row.id))}
                        >
                          <div class="truncate">
                            <Render of={cell.render()} />
                          </div>
                        </ExternalLinkWrapper>
                      </Table.Cell>
                    {/if}
                  </Subscribe>
                {/each}
              </Table.Row>
            </Subscribe>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {:else}
    {'問題を1問以上登録してください。'}
  {/if}
</div>
