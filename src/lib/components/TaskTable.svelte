<script lang="ts">
  import {
    ButtonGroup,
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';

  import type { TaskResults } from '$lib/types/task';

  export let taskResults: TaskResults;
</script>

<!-- TODO: ボタンの並び順を決める -->
<!-- FIXME: 冗長な記述をリファクタリング -->
<ButtonGroup class="m-4 contents-center">
  <Button outline color="primary">ABC</Button>
  <Button outline color="primary">APG4b</Button>
  <Button outline color="primary">ABS</Button>
  <Button outline color="primary">PAST</Button>
  <Button outline color="primary">Tessoku Book</Button>
  <Button outline color="primary">Math and Algorithm</Button>
  <Button outline color="primary">Typical90</Button>
  <Button outline color="primary">EDPC</Button>
  <Button outline color="primary">TDPC</Button>
  <Button outline color="primary">ACL Practice</Button>
  <Button outline color="primary">JOI</Button>
</ButtonGroup>

<!-- TODO: 条件に一致する問題をフィルタリングする -->
<!-- TODO: 該当する問題をテーブル形式で表示する -->
<div>AtCoder Beginners Contest</div>

<Table shadow hoverable={true}>
  <TableHead>
    <TableHeadCell>Contest</TableHeadCell>
    <TableHeadCell>A</TableHeadCell>
    <TableHeadCell>B</TableHeadCell>
    <TableHeadCell>C</TableHeadCell>
    <TableHeadCell>D</TableHeadCell>
    <TableHeadCell>E</TableHeadCell>
    <TableHeadCell>F</TableHeadCell>
    <TableHeadCell>G</TableHeadCell>
    <TableHeadCell>H/Ex</TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divede-y">
    <TableBodyRow>
      <TableBodyCell>ABC332</TableBodyCell>
      <TableBodyCell>A. hoge</TableBodyCell>
      <TableBodyCell>B. hoge</TableBodyCell>
      <TableBodyCell>C. hoge</TableBodyCell>
      <TableBodyCell>D. hoge</TableBodyCell>
      <TableBodyCell>E. hoge</TableBodyCell>
      <TableBodyCell>F. hoge</TableBodyCell>
      <TableBodyCell>G. hoge</TableBodyCell>
      <TableBodyCell>Ex. hoge</TableBodyCell>
    </TableBodyRow>
    <TableBodyRow>
      <TableBodyCell>ABC331</TableBodyCell>
      <TableBodyCell>A. hoge</TableBodyCell>
      <TableBodyCell>B. hoge</TableBodyCell>
      <TableBodyCell>C. hoge</TableBodyCell>
      <TableBodyCell>D. hoge</TableBodyCell>
      <TableBodyCell>E. hoge</TableBodyCell>
      <TableBodyCell>F. hoge</TableBodyCell>
      <TableBodyCell>G. hoge</TableBodyCell>
      <TableBodyCell></TableBodyCell>
    </TableBodyRow>
    <TableBodyRow>
      <TableBodyCell>ABC330</TableBodyCell>
      <TableBodyCell>A. hoge</TableBodyCell>
      <TableBodyCell>B. hoge</TableBodyCell>
      <TableBodyCell>C. hoge</TableBodyCell>
      <TableBodyCell>D. hoge</TableBodyCell>
      <TableBodyCell>E. hoge</TableBodyCell>
      <TableBodyCell>F. hoge</TableBodyCell>
      <TableBodyCell>G. hoge</TableBodyCell>
      <TableBodyCell></TableBodyCell>
    </TableBodyRow>
  </TableBody>
</Table>
