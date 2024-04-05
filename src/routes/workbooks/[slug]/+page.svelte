<script lang="ts">
  import {
    Breadcrumb,
    BreadcrumbItem,
    Label,
    Input,
    Select,
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableBodyCell,
    TableBodyRow,
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';

  let selectedValue: boolean = false;

  let isPublished = [
    { value: false, name: '非公開' },
    { value: true, name: '公開' },
  ];
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="(準備中) 問題集の詳細" />

  <Breadcrumb aria-label="">
    <BreadcrumbItem href="/workbooks" home>問題集一覧</BreadcrumbItem>
    <BreadcrumbItem>TODO: 問題集の名称を表示できるようにする</BreadcrumbItem>
  </Breadcrumb>

  <!-- 作者 -->
  <Label class="space-y-2">
    <span>ユーザ名</span>
    <Input size="md" value="novisteps_admin" />
  </Label>

  <!-- タイトル -->
  <Label class="space-y-2">
    <span>タイトル</span>
    <Input size="md" value="標準入出力" />
  </Label>

  <!-- 一般公開の有無 -->
  <Label class="space-y-2">
    <span>公開状況</span>
    <Select class="" items={isPublished} bind:value={selectedValue} />
  </Label>

  <!-- 問題を検索 -->
  TODO: 問題を検索して、追加できるようにする
  <br />

  <!-- 問題一覧 -->
  TODO: 問題一覧ページのコンポーネントを再利用する
  <Label class="space-y-2">
    <span>問題一覧</span>
  </Label>

  <Table shadow class="text-md">
    <TableHead class="text-sm bg-gray-100">
      <TableHeadCell class="w-1/6">提出状況</TableHeadCell>
      <TableHeadCell class="w-1/6">コンテスト名</TableHeadCell>
      <TableHeadCell class="w-7/12">問題名</TableHeadCell>
      <TableHeadCell class="w-1/12">
        <span class="sr-only">編集</span>
      </TableHeadCell>
    </TableHead>
    <!-- TODO: ダミーデータをオブジェクトとしてまとめて、eachで取り出せるように -->
    <TableBody tableBodyClass="divide-y">
      <!-- TODO: コンテスト名、問題名にリンクを付ける -->
      <!-- TODO: 編集にリンクを付ける -->
      <!-- TODO: 削除にゴミ箱マークを付ける -->
      <TableBodyRow>
        <TableBodyCell>AC</TableBodyCell>
        <TableBodyCell>ABC222</TableBodyCell>
        <TableBodyCell>A. Four Digits</TableBodyCell>
        <TableBodyCell>削除</TableBodyCell>
      </TableBodyRow>
      <TableBodyRow>
        <TableBodyCell>挑戦中</TableBodyCell>
        <TableBodyCell>ABC180</TableBodyCell>
        <TableBodyCell>A. box</TableBodyCell>
        <TableBodyCell>削除</TableBodyCell>
      </TableBodyRow>
    </TableBody>
  </Table>
</div>
