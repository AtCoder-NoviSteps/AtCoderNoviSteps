<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';

  export let workbooks;

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

<Table shadow class="text-md">
  <TableHead class="text-sm bg-gray-100">
    <TableHeadCell class="w-1/12">作者</TableHeadCell>
    <TableHeadCell class="w-1/4">タイトル</TableHeadCell>
    <TableHeadCell class="w-7/12">回答状況</TableHeadCell>
    <TableHeadCell class="w-1/12">
      <span class="sr-only">編集</span>
    </TableHeadCell>
  </TableHead>

  <TableBody tableBodyClass="divide-y">
    {#each workbooks as workbook}
      <TableBodyRow>
        <TableBodyCell>{workbook.author}</TableBodyCell>
        <TableBodyCell>
          <div>
            <span class="p-1 rounded-lg {getPublicationStatusColor(workbook.isPublished)}">
              {getPublicationStatusLabel(workbook.isPublished)}
            </span>
            <a
              href="/workbooks/{workbook.id}"
              class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            >
              {workbook.title}
            </a>
          </div>
        </TableBodyCell>
        <TableBodyCell>
          <ThermometerProgressBar
            submissionRatios={dummySubmissionRatios(80, 5, 5)}
            width="w-full"
          />
        </TableBodyCell>
        <TableBodyCell>{'編集 / 削除'}</TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
