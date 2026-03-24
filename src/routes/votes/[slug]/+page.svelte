<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from 'flowbite-svelte';
  import Check from '@lucide/svelte/icons/check';

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';

  import { taskGradeValues, TaskGrade } from '$lib/types/task';
  import { getTaskGradeLabel, getTaskUrl, getTaskGradeColor, toChangeTextColorIfNeeds } from '$lib/utils/task';
  import { SIGNUP_PAGE, LOGIN_PAGE } from '$lib/constants/navbar-links';

  let { data } = $props();

  const nonPendingGrades = taskGradeValues.filter((g) => g !== TaskGrade.PENDING);

  const totalVotes = $derived(
    data.counters ? data.counters.reduce((sum, c) => sum + c.count, 0) : 0,
  );

  function getCount(grade: string): number {
    return data.counters?.find((c) => c.grade === grade)?.count ?? 0;
  }

  function getPct(grade: string): number {
    if (totalVotes === 0) return 0;
    return Math.round((getCount(grade) / totalVotes) * 100);
  }
</script>

<div class="container mx-auto w-5/6 max-w-2xl">
  <!-- パンくず -->
  <nav class="text-sm text-gray-500 dark:text-gray-400 mb-4">
    <a href="/votes" class="hover:underline">グレード投票</a>
    <span class="mx-1">/</span>
    <span>{data.task.task_id}</span>
  </nav>

  <HeadingOne title={data.task.title} />

  <!-- 問題情報 -->
  <div class="flex items-center gap-3 mb-8">
    <GradeLabel
      taskGrade={data.task.grade}
      defaultPadding={0.25}
      defaultWidth={6}
      reducedWidth={6}
    />
    <ExternalLinkWrapper
      url={getTaskUrl(data.task.contest_id, data.task.task_id)}
      description={data.task.contest_id}
      iconSize={14}
    />
  </div>

  <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
    ※ 3票以上集まると中央値が暫定グレードとして一覧表に反映されます。
  </p>

  <!-- 投票UI -->
  {#if data.myVote?.voted}
    <!-- 投票済み → 統計表示 -->
    <div class="mb-6">
      <p class="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium mb-4">
        <Check class="w-5 h-5" strokeWidth={3} />
        投票済み：{getTaskGradeLabel(data.myVote.grade as TaskGrade)}
      </p>

      {#if data.stats}
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          暫定グレード：<strong>{getTaskGradeLabel(data.stats.grade)}</strong>（{totalVotes}票）
        </p>
      {/if}

      <!-- 分布表 -->
      <div class="space-y-1">
        {#each nonPendingGrades as grade}
          {@const count = getCount(grade)}
          {@const pct = getPct(grade)}
          {@const isMyVote = data.myVote?.grade === grade}
          <div class="flex items-center gap-2 text-sm">
            <span class="w-10 text-right text-gray-600 dark:text-gray-400 shrink-0">
              {getTaskGradeLabel(grade)}
            </span>
            <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden h-5">
              <div
                class="h-full rounded transition-all {isMyVote
                  ? 'bg-primary-500'
                  : 'bg-gray-300 dark:bg-gray-500'}"
                style="width: {pct}%"
              ></div>
            </div>
            <span class="w-14 text-gray-600 dark:text-gray-400 shrink-0">
              {count}票 ({pct}%)
            </span>
          </div>
        {/each}
      </div>
    </div>

    <!-- 投票変更フォーム -->
    <details class="mt-4">
      <summary
        class="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        投票を変更する
      </summary>
      <div class="mt-3">
        {@render voteForm()}
      </div>
    </details>
  {:else if data.isLoggedIn}
    <!-- 未投票・ログイン済み → 投票フォーム -->
    <p class="text-gray-600 dark:text-gray-300 mb-4">
      この問題のグレードを投票してください。投票後に集計結果を確認できます。
    </p>
    {@render voteForm()}
  {:else}
    <!-- 未ログイン -->
    <p class="text-gray-600 dark:text-gray-300 mb-4">投票するにはログインが必要です。</p>
    <div class="flex gap-3">
      <Button href={LOGIN_PAGE} color="primary">ログイン</Button>
      <Button href={SIGNUP_PAGE} color="alternative">アカウント作成</Button>
    </div>
  {/if}
</div>

{#snippet voteForm()}
  <form method="POST" action="?/voteAbsoluteGrade" use:enhance>
    <input type="hidden" name="taskId" value={data.task.task_id} />
    <div class="flex flex-wrap gap-2">
      {#each nonPendingGrades as grade}
        <button
          name="grade"
          value={grade}
          type="submit"
          class="px-3 py-1.5 rounded-md text-sm font-medium border transition-opacity
            {grade === TaskGrade.D6
              ? 'text-white shadow-md shadow-amber-900/80 ring-2 ring-amber-300/50 font-bold drop-shadow relative overflow-hidden'
              : toChangeTextColorIfNeeds(getTaskGradeLabel(grade))}
            {data.myVote?.grade === grade ? 'ring-2 ring-offset-1 ring-gray-600 dark:ring-gray-300' : 'opacity-80 hover:opacity-100'}"
          style={grade === TaskGrade.D6
            ? 'background-image: linear-gradient(to bottom right, var(--color-atcoder-D6), rgb(120, 113, 108), rgb(217, 119, 6)); border-color: var(--color-atcoder-D6);'
            : `background-color: ${getTaskGradeColor(grade)}; border-color: ${getTaskGradeColor(grade)};`}
        >
          {getTaskGradeLabel(grade)}
        </button>
      {/each}
    </div>
  </form>
{/snippet}
