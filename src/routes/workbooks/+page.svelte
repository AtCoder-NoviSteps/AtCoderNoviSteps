<script lang="ts">
  import {
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';

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

  const sampleWorkbooks = [
    {
      id: 1,
      author: 'novisteps_admin',
      title: '標準入出力',
      dummySubmissionRatios: dummySubmissionRatios(80, 5, 5),
    },
    {
      id: 2,
      author: 'novisteps_admin',
      title: '1個の整数値を受け取る',
      dummySubmissionRatios: dummySubmissionRatios(50, 25, 10),
    },
  ];
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="(準備中) 問題集" />

  <!-- 新規作成ボタンから、createページへ -->
  <Button href="/workbooks/create" type="submit">新規作成</Button>

  <!-- TODO: 一覧(ダミーデータ)を追加 -->
  <!-- TODO: ページネーションを追加 -->
  <br />
  TODO: 問題集の作成者のみ編集 / 削除ができるようにする <br />
  TODO: 実際のデータに置き換える <br />
  TODO: ページネーションを追加する
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
      <!-- TODO: 編集にリンクを付ける -->
      <!-- TODO: 削除にゴミ箱マークを付ける -->
      {#each sampleWorkbooks as workbook}
        <TableBodyRow>
          <TableBodyCell>{workbook.author}</TableBodyCell>
          <TableBodyCell>
            <a
              href="/workbooks/{workbook.id}"
              class="font-medium text-primary-600 hover:underline dark:text-primary-500"
            >
              {workbook.title}
            </a>
          </TableBodyCell>
          <TableBodyCell>
            <ThermometerProgressBar
              submissionRatios={workbook.dummySubmissionRatios}
              width="w-full"
            />
          </TableBodyCell>
          <TableBodyCell>編集 / 削除</TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
