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
    Tooltip,
  } from 'flowbite-svelte';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import FlaskConical from '@lucide/svelte/icons/flask-conical';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import RelativeEvaluationBadge from '$features/votes/components/RelativeEvaluationBadge.svelte';

  import { TaskGrade } from '$lib/types/task';

  import { getContestNameLabel } from '$lib/utils/contest';
  import { getTaskUrl, compareByContestIdAndTaskId } from '$lib/utils/task';
  import { filterTasksBySearch } from '$lib/utils/task_filter';
  import { resolveDisplayGrade } from '$features/votes/utils/grade_options';

  const MAX_SEARCH_RESULTS = 20;

  let { data } = $props();

  let search = $state('');

  const sortedTasks = $derived([...data.tasks].sort(compareByContestIdAndTaskId));
  const filteredTasks = $derived(filterTasksBySearch(sortedTasks, search, MAX_SEARCH_RESULTS));
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="投票" />

  <div class="mb-4 max-w-md">
    <Input placeholder="問題名・問題ID・出典で検索" bind:value={search} />
  </div>

  <div class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
    <Table hoverable>
      <TableHead>
        <TableHeadCell class="text-sm">グレード</TableHeadCell>
        <TableHeadCell class="text-sm">問題名</TableHeadCell>
        <TableHeadCell class="text-sm">出典</TableHeadCell>
        <TableHeadCell class="text-sm">票数</TableHeadCell>
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
            {@const displayGrade = resolveDisplayGrade(task.grade, task.estimatedGrade)}
            {@const isProvisional =
              task.grade === TaskGrade.PENDING && displayGrade !== TaskGrade.PENDING}
            <TableBodyRow>
              <TableBodyCell class="text-base">
                <div class="flex items-center gap-1.5">
                  {#if isProvisional}
                    <span
                      id="flask-{task.task_id}"
                      class="cursor-help text-gray-500 dark:text-gray-400"
                      tabindex="0"
                      role="img"
                      aria-label="暫定グレード"
                    >
                      <FlaskConical class="w-4 h-4" aria-hidden="true" />
                    </span>
                    <Tooltip triggeredBy="#flask-{task.task_id}" placement="top">
                      3票以上集まると中央値が暫定グレードとして一覧表に反映されます。
                    </Tooltip>
                  {/if}

                  <div class="relative inline-block">
                    <GradeLabel taskGrade={displayGrade} />
                    {#if task.grade !== TaskGrade.PENDING && task.estimatedGrade}
                      <RelativeEvaluationBadge
                        officialGrade={task.grade}
                        medianGrade={task.estimatedGrade}
                        badgeId="relative-eval-{task.task_id}"
                      />
                    {/if}
                  </div>
                </div>
              </TableBodyCell>
              <TableBodyCell class="text-base">
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
                    rel="noopener noreferrer external"
                    aria-label={`${task.title} を別タブで開く`}
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                  >
                    <ExternalLink class="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              </TableBodyCell>
              <TableBodyCell class="text-base">{getContestNameLabel(task.contest_id)}</TableBodyCell
              >
              <TableBodyCell class="text-base">{task.voteTotal}</TableBodyCell>
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
