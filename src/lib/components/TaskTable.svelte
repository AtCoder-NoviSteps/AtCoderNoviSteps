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

  import type { TaskResults, TaskResult } from '$lib/types/task';
  import { ContestType } from '$lib/types/contest';
  import { classifyContest, getContestNameLabel } from '$lib/utils/contest';
  import { getTaskTableHeaderName } from '$lib/utils/task';

  export let taskResults: TaskResults;

  let selectedContestType: ContestType;
  let selectedTaskResults: TaskResults | null = null;
  let contestNames: Array<string> | null = null;
  let headerNames: Array<string> | null = null;

  // FIXME: 冗長な記述をリファクタリング
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const handleClick = (event: any) => {
    selectedContestType = event.target.value;

    selectedTaskResults = taskResults.filter(
      (taskResult: TaskResult) => classifyContest(taskResult.contest_id) === selectedContestType,
    );

    const contestList = selectedTaskResults.map((taskResult: TaskResult) => taskResult.contest_id);
    contestNames = Array.from(new Set(contestList)).sort().reverse();

    const headerList = selectedTaskResults.map((taskResult: TaskResult) =>
      getTaskTableHeaderName(selectedContestType, taskResult),
    );
    headerNames = Array.from(new Set(headerList)).sort();
  };
</script>

<!-- TODO: ボタンの並び順を決める -->
<!-- FIXME: 冗長な記述をリファクタリング -->
<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/button-group -->
<ButtonGroup class="m-4 contents-center">
  <Button outline value={ContestType.ABC} color="primary" on:click={handleClick}>ABC</Button>
  <Button outline value={ContestType.APG4B} color="primary" on:click={handleClick}>APG4b</Button>
  <Button outline value={ContestType.ABS} color="primary" on:click={handleClick}>ABS</Button>
  <Button outline value={ContestType.PAST} color="primary" on:click={handleClick}>PAST</Button>
  <Button outline value={ContestType.TESSOKU_BOOK} color="primary" on:click={handleClick}>
    Tessoku Book
  </Button>
  <Button outline value={ContestType.MATH_AND_ALGORITHM} color="primary" on:click={handleClick}>
    Math and Algorithm
  </Button>
  <Button outline value={ContestType.TYPICAL90} color="primary" on:click={handleClick}>
    Typical90
  </Button>
  <Button outline value={ContestType.EDPC} color="primary" on:click={handleClick}>EDPC</Button>
  <Button outline value={ContestType.TDPC} color="primary" on:click={handleClick}>TDPC</Button>
  <Button outline value={ContestType.ACL_PRACTICE} color="primary" on:click={handleClick}>
    ACL Practice
  </Button>
  <Button outline value={ContestType.JOI} color="primary" on:click={handleClick}>JOI</Button>
</ButtonGroup>

<!-- TODO: 条件に一致する問題をフィルタリングする -->
<!-- TODO: 該当する問題をテーブル形式で表示する -->
<div>AtCoder Beginners Contest</div>

<!-- TODO: 初期状態でABCが選択された状態にする(ライブラリ的に難しい?) -->
<!-- FIXME: nullの状態のときは表示しないようにする -->
<Table shadow hoverable={true}>
  <TableHead>
    <TableHeadCell>Contest</TableHeadCell>
    {#if headerNames !== null && headerNames.length > 0}
      {#each headerNames as headerName}
        <TableHeadCell>{headerName}</TableHeadCell>
      {/each}
    {/if}
  </TableHead>
  <TableBody tableBodyClass="divede-y">
    {#if contestNames !== null && contestNames.length > 0}
      <!-- HACK: for ABC only. -->
      {#if selectedContestType === ContestType.ABC}
        {#each contestNames as contestName}
          <TableBodyRow>
            <TableBodyCell>{getContestNameLabel(contestName)}</TableBodyCell>
          </TableBodyRow>
        {/each}
      {/if}
    {/if}
  </TableBody>
</Table>
