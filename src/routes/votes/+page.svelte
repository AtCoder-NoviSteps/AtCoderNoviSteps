<script lang="ts">
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Input,
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';

  let { data } = $props();

  let search = $state('');

  const filteredTasks = $derived(
    search === ''
      ? data.tasks
      : data.tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            t.task_id.toLowerCase().includes(search.toLowerCase()) ||
            t.contest_id.toLowerCase().includes(search.toLowerCase()),
        ),
  );
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="グレード投票" />

  <div class="mb-4 max-w-md">
    <Input placeholder="問題名・問題ID・コンテストIDで検索" bind:value={search} />
  </div>

  <Table hoverable>
    <TableHead>
      <TableHeadCell>問題</TableHeadCell>
      <TableHeadCell>コンテスト</TableHeadCell>
      <TableHeadCell>暫定グレード</TableHeadCell>
      <TableHeadCell>票数</TableHeadCell>
    </TableHead>
    <TableBody class="divide-y">
      {#each filteredTasks as task (task.task_id)}
        <TableBodyRow>
          <TableBodyCell>
            <a
              href="/votes/{task.task_id}"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {task.title}
            </a>
          </TableBodyCell>
          <TableBodyCell>{task.contest_id}</TableBodyCell>
          <TableBodyCell>
            {#if task.estimatedGrade}
              <GradeLabel
                taskGrade={task.estimatedGrade}
                defaultPadding={0.25}
                defaultWidth={6}
                reducedWidth={6}
              />
            {:else}
              <span class="text-gray-400 dark:text-gray-500">-</span>
            {/if}
          </TableBodyCell>
          <TableBodyCell>{task.voteTotal}</TableBodyCell>
        </TableBodyRow>
      {/each}
      {#if filteredTasks.length === 0}
        <TableBodyRow>
          <TableBodyCell colspan={4} class="text-center text-gray-500 dark:text-gray-400">
            該当する問題が見つかりませんでした
          </TableBodyCell>
        </TableBodyRow>
      {/if}
    </TableBody>
  </Table>
</div>
