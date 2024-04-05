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

  // FIXME: 実際のデータに置き換え
  const dummySubmissionRatios = [
    {
      name: 'ac',
      ratioPercent: Math.random() * 100,
      color: 'bg-atcoder-ac-background',
    },
    {
      name: 'ac_with_editorial',
      ratioPercent: Math.random() * 50,
      color: 'bg-atcoder-ac-with_editorial-background',
    },
    {
      name: 'wa',
      ratioPercent: Math.random() * 10,
      color: 'bg-atcoder-wa-background',
    },
  ];

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import ThermometerProgressBar from '$lib/components/ThermometerProgressBar.svelte';
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="(準備中) 問題集" />

  TODO: 新規作成ボタンを押したら、問題集を作成できるようにする <br />
  <!-- TODO: 新規作成ボタンから、createページへ -->
  <Button type="submit">新規作成</Button>

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
    <!-- TODO: ダミーデータをオブジェクトとしてまとめて、eachで取り出せるように -->
    <TableBody tableBodyClass="divide-y">
      <!-- TODO: 問題集の名称にリンクを付ける -->
      <!-- TODO: 編集にリンクを付ける -->
      <!-- TODO: 削除にゴミ箱マークを付ける -->
      <!-- TODO: プログレスバーを付ける (できればコンポーネントを再利用) -->
      <TableBodyRow>
        <TableBodyCell>novisteps_admin</TableBodyCell>
        <TableBodyCell>
          <a
            href="/workbooks/1"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            標準入出力
          </a>
        </TableBodyCell>
        <TableBodyCell>
          <ThermometerProgressBar submissionRatios={dummySubmissionRatios} width="w-fulll" />
        </TableBodyCell>
        <TableBodyCell>編集 / 削除</TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>novisteps_admin</TableBodyCell>
        <TableBodyCell>
          <a
            href="/workbooks/2"
            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            1個の整数値を受け取る
          </a>
        </TableBodyCell>
        <TableBodyCell>
          <ThermometerProgressBar submissionRatios={dummySubmissionRatios} width="w-full" />
        </TableBodyCell>
        <TableBodyCell>編集 / 削除</TableBodyCell>
      </TableBodyRow>
    </TableBody>
  </Table>
</div>
