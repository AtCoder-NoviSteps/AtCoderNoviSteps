<script lang="ts">
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
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import FlaskConical from '@lucide/svelte/icons/flask-conical';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';

  import { TaskGrade } from '$lib/types/task';
  import { getTaskUrl } from '$lib/utils/task';
  import { getContestNameLabel } from '$lib/utils/contest';

  const MAX_SEARCH_RESULTS = 20;

  let { data } = $props();

  let search = $state('');

  const filteredTasks = $derived(
    search === ''
      ? []
      : data.tasks
          .filter(
            (t) =>
              (t.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
              (t.task_id ?? '').toLowerCase().includes(search.toLowerCase()) ||
              (t.contest_id ?? '').toLowerCase().includes(search.toLowerCase()),
          )
          .sort((a, b) => (b.contest_id > a.contest_id ? 1 : b.contest_id < a.contest_id ? -1 : 0))
          .slice(0, MAX_SEARCH_RESULTS),
  );
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="投票" />

  <div class="mb-4 max-w-md">
    <Input placeholder="問題名・問題ID・出典で検索" bind:value={search} />
  </div>

  <div class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
    <Table hoverable>
      <TableHead>
        <TableHeadCell>グレード</TableHeadCell>
        <TableHeadCell>問題名</TableHeadCell>
        <TableHeadCell>出典</TableHeadCell>
        <TableHeadCell>票数</TableHeadCell>
      </TableHead>
      <TableBody class="divide-y divide-gray-100 dark:divide-gray-700">
        {#if search === ''}
          <TableBodyRow>
            <TableBodyCell colspan={4} class="text-center text-gray-500 dark:text-gray-400">
              問題名・問題ID・出典で検索してください
            </TableBodyCell>
          </TableBodyRow>
        {:else}
          {#each filteredTasks as task (task.task_id)}
            {@const isProvisional =
              task.grade === TaskGrade.PENDING && task.estimatedGrade !== null}
            {@const displayGrade =
              task.grade !== TaskGrade.PENDING ? task.grade : (task.estimatedGrade ?? task.grade)}
            <TableBodyRow>
              <TableBodyCell>
                <div class="flex items-center gap-1.5">
                  {#if isProvisional}
                    <span
                      title="3票以上集まると中央値が暫定グレードとして一覧表に反映されます。"
                      class="cursor-help text-gray-500 dark:text-gray-400"
                    >
                      <FlaskConical class="w-4 h-4" />
                    </span>
                  {/if}
                  {#if displayGrade !== TaskGrade.PENDING}
                    <GradeLabel
                      taskGrade={displayGrade}
                      defaultPadding={0.25}
                      defaultWidth={6}
                      reducedWidth={6}
                    />
                  {:else}
                    <span class="text-gray-400 dark:text-gray-500">-</span>
                  {/if}
                </div>
              </TableBodyCell>
              <TableBodyCell>
                <div class="flex items-center gap-1.5">
                  <a
                    href={resolve('/votes/[slug]', { slug: task.task_id })}
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {task.title}
                  </a>
                  <a
                    href={getTaskUrl(task.contest_id, task.task_id)}
                    target="_blank"
                    rel="noreferrer external"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                  </a>
                </div>
              </TableBodyCell>
              <TableBodyCell>{getContestNameLabel(task.contest_id)}</TableBodyCell>
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
        {/if}
      </TableBody>
    </Table>
  </div>
</div>
