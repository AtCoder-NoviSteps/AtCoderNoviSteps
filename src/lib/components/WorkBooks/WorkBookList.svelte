<script lang="ts">
  import { enhance } from '$app/forms';
  import { writable } from 'svelte/store';
  import { createTable, Render, Subscribe } from 'svelte-headless-table';

  import * as Table from '$lib/components/ui/table';
  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';

  import type { WorkBooksList } from '$lib/types/workbook';
  import type { Roles } from '$lib/types/user';
  import { canRead, canEdit, canDelete } from '$lib/utils/authorship';

  export let workbooks: WorkBooksList;
  export let loggedInUser;

  let userId = loggedInUser.id;
  let role: Roles = loggedInUser.role;

  // See:
  // https://www.shadcn-svelte.com/docs/components/data-table
  const table = createTable(writable(workbooks));
  const columns = table.createColumns([
    table.column({
      accessor: 'authorName',
      header: '作者',
    }),
    table.column({
      accessor: 'title',
      header: 'タイトル',
    }),
    table.column({
      accessor: 'workBookTasks',
      header: '回答状況',
    }),
    table.column({
      accessor: 'authorId',
      header: '',
    }),
  ]);
  const { headerRows, pageRows, tableAttrs, tableBodyAttrs } = table.createViewModel(columns);

  const getWorkBook = (id: string) => {
    return workbooks[Number(id)];
  };

  const getPublicationStatusLabel = (isPublished: boolean) => {
    if (isPublished) {
      return '公開';
    } else {
      return '非公開';
    }
  };
  const getPublicationStatusColor = (isPublished: boolean) => {
    if (isPublished) {
      return 'bg-primary-200';
    } else {
      return 'bg-red-200';
    }
  };

  // FIXME: 実際のデータに置き換え
  const dummySubmissionRatios = (
    acRatio: number,
    acWithEditorialRatio: number,
    waRatio: number,
  ) => {
    const ratios = [
      {
        name: 'ac',
        ratioPercent: acRatio,
        color: 'bg-atcoder-ac-background',
      },
      {
        name: 'ac_with_editorial',
        ratioPercent: acWithEditorialRatio,
        color: 'bg-atcoder-ac-with_editorial-background',
      },
      {
        name: 'wa',
        ratioPercent: waRatio,
        color: 'bg-atcoder-wa-background',
      },
    ];

    return ratios;
  };
</script>

{#if workbooks.length >= 1}
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
            {#if getWorkBook(row.id) && canRead(getWorkBook(row.id).isPublished, userId, getWorkBook(row.id).authorId)}
              <Table.Row {...rowAttrs}>
                {#each row.cells as cell (cell.id)}
                  <Subscribe attrs={cell.attrs()} let:attrs>
                    {#if cell.id === 'authorName'}
                      <Table.Cell {...attrs} class="min-w-[96px] max-w-[120px]">
                        <div class="truncate">
                          <Render of={cell.render()} />
                        </div>
                      </Table.Cell>
                    {:else if cell.id === 'title'}
                      <Table.Cell {...attrs} class="min-w-[120px] max-w-[180px]">
                        <div class="flex items-center space-x-2 truncate">
                          <span
                            class="p-1 rounded-lg {getPublicationStatusColor(
                              getWorkBook(row.id).isPublished,
                            )}"
                          >
                            {getPublicationStatusLabel(getWorkBook(row.id).isPublished)}
                          </span>
                          <a
                            href="/workbooks/{getWorkBook(row.id).id}"
                            class="font-medium text-primary-600 hover:underline dark:text-primary-500 truncate"
                          >
                            <Render of={cell.render()} />
                          </a>
                        </div>
                      </Table.Cell>
                    {:else if cell.id === 'workBookTasks'}
                      <Table.Cell {...attrs} class="min-w-[240px]">
                        <ThermometerProgressBar
                          submissionRatios={dummySubmissionRatios(80, 5, 5)}
                          width="min-w-[240px] w-full "
                        />
                      </Table.Cell>
                    {:else if cell.id === 'authorId'}
                      <Table.Cell {...attrs} class="min-w-[96px] max-w-[120px]">
                        <div class="flex justify-center items-center space-x-3">
                          {#if canEdit(loggedInUser.id, getWorkBook(row.id).authorId, role, getWorkBook(row.id).isPublished)}
                            <a href="/workbooks/edit/{getWorkBook(row.id).id}">編集</a>
                          {/if}

                          {#if canDelete(loggedInUser.id, getWorkBook(row.id).authorId)}
                            <form
                              method="POST"
                              action="?/delete&slug={getWorkBook(row.id).id}"
                              use:enhance
                            >
                              <button>削除</button>
                            </form>
                          {/if}
                        </div>
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
  該当する問題集が見つかりませんでした。「新規作成」ボタンを押して、問題集を作成してください。
{/if}
