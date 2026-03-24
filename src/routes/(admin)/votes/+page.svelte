<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Badge,
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';

  let { data } = $props();
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="投票管理" />

  <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
    集計済み統計一覧（3票以上で暫定グレードが算出されます）
  </p>

  <Table hoverable>
    <TableHead>
      <TableHeadCell>問題</TableHeadCell>
      <TableHeadCell>コンテスト</TableHeadCell>
      <TableHeadCell>DBグレード</TableHeadCell>
      <TableHeadCell>中央値グレード</TableHeadCell>
      <TableHeadCell>票数</TableHeadCell>
      <TableHeadCell>ステータス</TableHeadCell>
    </TableHead>
    <TableBody class="divide-y">
      {#each data.stats as stat (stat.taskId)}
        <TableBodyRow>
          <TableBodyCell>
            <a
              href="/votes/{stat.taskId}"
              class="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              {stat.title}
            </a>
          </TableBodyCell>
          <TableBodyCell class="text-sm">{stat.contestId}</TableBodyCell>
          <TableBodyCell>
            <GradeLabel
              taskGrade={stat.dbGrade}
              defaultPadding={0.25}
              defaultWidth={6}
              reducedWidth={6}
            />
          </TableBodyCell>
          <TableBodyCell>
            <GradeLabel
              taskGrade={stat.estimatedGrade}
              defaultPadding={0.25}
              defaultWidth={6}
              reducedWidth={6}
            />
          </TableBodyCell>
          <TableBodyCell class="text-sm">{stat.voteTotal}</TableBodyCell>
          <TableBodyCell>
            <div class="flex gap-1 flex-wrap">
              {#if stat.isExperimental}
                <Badge color="yellow">暫定</Badge>
              {/if}
              {#if stat.isApproved}
                <Badge color="green">承認済</Badge>
              {:else}
                <Badge color="red">未承認</Badge>
              {/if}
            </div>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
      {#if data.stats.length === 0}
        <TableBodyRow>
          <TableBodyCell colspan={6} class="text-center text-gray-500 dark:text-gray-400">
            集計データがありません
          </TableBodyCell>
        </TableBodyRow>
      {/if}
    </TableBody>
  </Table>
</div>
