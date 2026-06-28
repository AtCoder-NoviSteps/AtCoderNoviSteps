<script lang="ts">
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';

  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Input,
    PaginationNav,
  } from 'flowbite-svelte';

  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import RelativeEvaluationBadge from '$features/votes/components/RelativeEvaluationBadge.svelte';

  import { taskGradeValues, TaskGrade } from '$lib/types/task';
  import type { TaskWithVoteInfo } from '$features/votes/services/vote_statistics';

  import { addContestNameToTaskIndex } from '$lib/utils/contest';
  import {
    getTaskGradeLabel,
    compareByContestIdAndTaskId,
    removeTaskIndexFromTitle,
  } from '$lib/utils/task';

  import { filterGradeTableTasks } from '../_utils/grade_table_filter';

  const PAGE_SIZE = 50;

  interface Props {
    title: string;
    tasks: TaskWithVoteInfo[];
  }

  let { title, tasks }: Props = $props();

  let search = $state('');
  let currentPage = $state(1);

  const sortedTasks = $derived([...tasks].sort(compareByContestIdAndTaskId));
  const filteredTasks = $derived(filterGradeTableTasks(sortedTasks, search));
  const isSearchEmpty = $derived(search.trim() === '');

  $effect(() => {
    filteredTasks;
    currentPage = 1;
  });

  const totalPages = $derived(Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE)));
  const pagedTasks = $derived(
    filteredTasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
  );
</script>

<h2 class="text-xl font-semibold mb-4 dark:text-white">
  {title}（{filteredTasks.length} / {tasks.length} 問）
</h2>

<div class="mb-4 flex items-center justify-between gap-4">
  <div class="w-full max-w-md">
    <Input aria-label="Search tasks" placeholder="問題名・問題ID・出典で検索" bind:value={search} />
  </div>

  {@render paginationNav()}
</div>

<div class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
  <Table hoverable>
    <TableHead>
      <TableHeadCell scope="col">問題名</TableHeadCell>
      <TableHeadCell scope="col">出典</TableHeadCell>
      <TableHeadCell scope="col">グレード（admin）</TableHeadCell>
      <TableHeadCell scope="col">グレード（ユーザ投票）</TableHeadCell>
      <TableHeadCell scope="col">投票総数</TableHeadCell>
    </TableHead>
    <TableBody class="divide-y divide-gray-100 dark:divide-gray-700">
      {#if isSearchEmpty}
        <TableBodyRow>
          <TableBodyCell colspan={5} class="text-center text-gray-500 dark:text-gray-400">
            問題名・問題ID・出典を入力してください
          </TableBodyCell>
        </TableBodyRow>
      {:else if filteredTasks.length === 0}
        <TableBodyRow>
          <TableBodyCell colspan={5} class="text-center text-gray-500 dark:text-gray-400">
            該当する問題が見つかりませんでした
          </TableBodyCell>
        </TableBodyRow>
      {:else}
        {#each pagedTasks as task (task.task_id)}
          <TableBodyRow>
            <TableBodyCell>
              <a
                href={resolve('/votes/[slug]', { slug: task.task_id })}
                class="text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                {removeTaskIndexFromTitle(task.title, task.task_table_index)}
              </a>
            </TableBodyCell>

            <TableBodyCell class="text-sm">
              {addContestNameToTaskIndex(task.contest_id, task.task_table_index)}
            </TableBodyCell>

            {@render adminGradeCell(task)}

            <TableBodyCell>
              {#if task.estimatedGrade}
                <GradeLabel
                  taskGrade={task.estimatedGrade}
                  defaultPadding={0.25}
                  defaultWidth={6}
                  reducedWidth={6}
                />
              {/if}
            </TableBodyCell>

            <TableBodyCell class="text-sm text-center">
              {task.voteTotal >= 1 ? task.voteTotal : '-'}
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      {/if}
    </TableBody>
  </Table>
</div>

{#if totalPages > 1}
  <div class="mt-4 flex justify-end">
    {@render paginationNav()}
  </div>
{/if}

{#snippet paginationNav()}
  {#if totalPages > 1}
    <PaginationNav
      {currentPage}
      {totalPages}
      onPageChange={(page) => {
        currentPage = page;
      }}
      class="[&_button]:border-gray-300 [&_button]:dark:border-gray-700"
    />
  {/if}
{/snippet}

{#snippet adminGradeCell(task: TaskWithVoteInfo)}
  <TableBodyCell>
    <div class="flex items-center gap-2">
      <form method="POST" action="?/setTaskGrade" use:enhance>
        <input type="hidden" name="taskId" value={task.task_id} />
        <select
          name="grade"
          aria-label="Select grade for {task.title}"
          onchange={(event) => (event.currentTarget as HTMLSelectElement).form?.requestSubmit()}
          class="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 focus:ring-primary-500 focus:border-primary-500 min-w-20"
        >
          {#each taskGradeValues as grade (grade)}
            <option value={grade} selected={task.grade === grade}>
              {grade === 'PENDING' ? '-' : getTaskGradeLabel(grade)}
            </option>
          {/each}
        </select>
      </form>

      {#if task.grade !== TaskGrade.PENDING}
        <div class="relative inline-block">
          <GradeLabel
            taskGrade={task.grade}
            defaultPadding={0.25}
            defaultWidth={6}
            reducedWidth={6}
          />

          {#if task.estimatedGrade}
            <RelativeEvaluationBadge
              officialGrade={task.grade}
              medianGrade={task.estimatedGrade}
              badgeId="relative-eval-{task.task_id}"
            />
          {/if}
        </div>
      {/if}
    </div>
  </TableBodyCell>
{/snippet}
