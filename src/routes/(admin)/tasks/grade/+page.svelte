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
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
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
  import { filterTasksBySearch } from '$lib/utils/task_filter';

  const MAX_SEARCH_RESULTS = 20;

  let { data } = $props();

  let search = $state('');

  const sortedTasks = $derived([...data.tasks].sort(compareByContestIdAndTaskId));
  const filteredTasks = $derived(filterTasksBySearch(sortedTasks, search, MAX_SEARCH_RESULTS));
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="グレード管理" />

  <div class="mb-4 max-w-md">
    <Input aria-label="Search tasks" placeholder="問題名・問題ID・出典で検索" bind:value={search} />
  </div>

  <Table hoverable>
    <TableHead>
      <TableHeadCell scope="col">問題名</TableHeadCell>
      <TableHeadCell scope="col">出典</TableHeadCell>
      <TableHeadCell scope="col">グレード（admin）</TableHeadCell>
      <TableHeadCell scope="col">グレード（ユーザ投票）</TableHeadCell>
    </TableHead>
    <TableBody class="divide-y">
      {#if search === ''}
        <TableBodyRow>
          <TableBodyCell colspan={4} class="text-center text-gray-500 dark:text-gray-400">
            問題名・問題ID・出典を入力してください
          </TableBodyCell>
        </TableBodyRow>
      {:else}
        {#each filteredTasks as task (task.task_id)}
          <TableBodyRow>
            <!-- Task name -->
            <TableBodyCell>
              <a
                href={resolve('/votes/[slug]', { slug: task.task_id })}
                class="text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                {removeTaskIndexFromTitle(task.title, task.task_table_index)}
              </a>
            </TableBodyCell>

            <!-- Reference -->
            <TableBodyCell class="text-sm">
              {addContestNameToTaskIndex(task.contest_id, task.task_table_index)}
            </TableBodyCell>

            <!-- Grade for admin -->
            {@render adminGradeCell(task)}

            <!-- Grade for user votes -->
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
          </TableBodyRow>
        {:else}
          <TableBodyRow>
            <TableBodyCell colspan={4} class="text-center text-gray-500 dark:text-gray-400">
              該当する問題が見つかりませんでした
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      {/if}
    </TableBody>
  </Table>
</div>

{#snippet adminGradeCell(task: TaskWithVoteInfo)}
  <TableBodyCell>
    <div class="flex items-center gap-2">
      <form method="POST" action="?/setTaskGrade" use:enhance>
        <input type="hidden" name="taskId" value={task.task_id} />
        <select
          name="grade"
          aria-label="Select grade for {task.title}"
          onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
          class="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 focus:ring-primary-500 focus:border-primary-500 min-w-20"
        >
          {#each taskGradeValues as grade (grade)}
            <option value={grade} selected={task.grade === grade}>
              {grade === 'PENDING' ? '-' : getTaskGradeLabel(grade)}
            </option>
          {/each}
        </select>
      </form>

      {#if task.grade !== TaskGrade.PENDING && task.estimatedGrade}
        <div class="relative inline-block">
          <GradeLabel
            taskGrade={task.grade}
            defaultPadding={0.25}
            defaultWidth={6}
            reducedWidth={6}
          />
          <RelativeEvaluationBadge
            officialGrade={task.grade}
            medianGrade={task.estimatedGrade}
            badgeId="relative-eval-{task.task_id}"
          />
        </div>
      {/if}
    </div>
  </TableBodyCell>
{/snippet}
