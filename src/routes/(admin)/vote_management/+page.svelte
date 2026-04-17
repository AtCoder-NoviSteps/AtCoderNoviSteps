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
  } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import RelativeEvaluationBadge from '$features/votes/components/RelativeEvaluationBadge.svelte';

  import { taskGradeValues, TaskGrade } from '$lib/types/task';
  import { getTaskGradeLabel } from '$lib/utils/task';

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
    </TableHead>
    <TableBody class="divide-y">
      {#each data.stats as stat (stat.taskId)}
        <TableBodyRow>
          <TableBodyCell>
            <a
              href={resolve('/votes/[slug]', { slug: stat.taskId })}
              class="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              {stat.title}
            </a>
          </TableBodyCell>
          <TableBodyCell class="text-sm">{stat.contestId}</TableBodyCell>
          <TableBodyCell>
            <div class="flex items-center gap-2">
              <form method="POST" action="?/setTaskGrade" use:enhance>
                <input type="hidden" name="taskId" value={stat.taskId} />
                <select
                  name="grade"
                  onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
                  class="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 focus:ring-primary-500 focus:border-primary-500 min-w-20"
                >
                  {#each taskGradeValues as grade (grade)}
                    <option value={grade} selected={stat.dbGrade === grade}>
                      {grade === 'PENDING' ? '-' : getTaskGradeLabel(grade)}
                    </option>
                  {/each}
                </select>
              </form>
              {#if stat.dbGrade !== TaskGrade.PENDING && stat.estimatedGrade}
                <div class="relative inline-block">
                  <GradeLabel
                    taskGrade={stat.dbGrade}
                    defaultPadding={0.25}
                    defaultWidth={6}
                    reducedWidth={6}
                  />
                  <RelativeEvaluationBadge
                    officialGrade={stat.dbGrade}
                    medianGrade={stat.estimatedGrade}
                    badgeId="relative-eval-{stat.taskId}"
                  />
                </div>
              {/if}
            </div>
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
        </TableBodyRow>
      {/each}
      {#if data.stats.length === 0}
        <TableBodyRow>
          <TableBodyCell colspan={5} class="text-center text-gray-500 dark:text-gray-400">
            集計データがありません
          </TableBodyCell>
        </TableBodyRow>
      {/if}
    </TableBody>
  </Table>
</div>
