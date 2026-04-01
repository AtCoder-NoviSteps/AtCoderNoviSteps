<script lang="ts">
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import { Button } from 'flowbite-svelte';
  import GradeLabel from '$lib/components/GradeLabel.svelte';

  import { TaskGrade } from '$lib/types/task';
  import {
    getTaskGradeLabel,
    getTaskUrl,
    getTaskGradeColor,
    toChangeTextColorIfNeeds,
  } from '$lib/utils/task';
  import { nonPendingGrades } from '$features/votes/utils/grade_options';
  import { SIGNUP_PAGE, LOGIN_PAGE, EDIT_PROFILE_PAGE } from '$lib/constants/navbar-links';
  import VoteDonutChart from '$features/votes/components/VoteDonutChart.svelte';

  let { data } = $props();

  const editProfileHref = `${resolve(EDIT_PROFILE_PAGE)}?tab=atcoder`;

  const totalVotes = $derived(
    data.counters ? data.counters.reduce((sum, c) => sum + c.count, 0) : 0,
  );
</script>

<div class="container mx-auto w-5/6 max-w-2xl">
  <!-- パンくず -->
  <nav class="text-sm text-gray-500 dark:text-gray-400 mb-4">
    <a href={resolve('/votes', {})} class="hover:underline">グレード投票</a>
    <span class="mx-1">/</span>
    <span>{data.task.task_id}</span>
  </nav>

  <div class="flex items-center gap-3 py-6 mb-2">
    <GradeLabel
      taskGrade={data.task.grade}
      defaultPadding={0.25}
      defaultWidth={6}
      reducedWidth={6}
    />
    <h1 class="text-3xl font-normal truncate dark:text-white">
      <a
        href={getTaskUrl(data.task.contest_id, data.task.task_id)}
        rel="noreferrer external"
        class="hover:underline">{data.task.title}</a
      >
    </h1>
  </div>

  <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
    ※ 3票以上集まると中央値が暫定グレードとして一覧表に反映されます。
  </p>

  <!-- 投票UI -->
  {#if data.myVote?.voted}
    <!-- 投票済み → 統計表示 -->
    <div class="mb-6">
      {#if data.stats}
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          暫定グレード：<strong>{getTaskGradeLabel(data.stats.grade)}</strong>（{totalVotes}票）
        </p>
      {/if}

      <!-- 投票変更フォーム -->
      <details class="mb-4">
        <summary
          class="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          投票を変更する
        </summary>
        <div class="mt-3">
          {@render voteForm()}
        </div>
      </details>

      <!-- 分布グラフ -->
      <VoteDonutChart
        counters={data.counters ?? []}
        {totalVotes}
        medianGrade={data.stats?.grade ?? null}
        votedGrade={data.myVote?.grade ?? null}
      />
    </div>
  {:else if data.isLoggedIn && !data.isAtCoderVerified}
    <!-- ログイン済み・未認証 → 認証誘導 -->
    <div
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4"
    >
      <p class="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
        投票するにはAtCoderアカウントの認証が必要です。
      </p>
      <Button href={editProfileHref} color="yellow" size="sm">AtCoderアカウントを認証する</Button>
    </div>
  {:else if data.isLoggedIn}
    <!-- 未投票・ログイン済み・認証済み → 投票フォーム -->
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
      {#each nonPendingGrades as grade (grade)}
        <button
          name="grade"
          value={grade}
          type="submit"
          class="px-3 py-1.5 rounded-md text-sm font-medium border transition-opacity
            {grade === TaskGrade.D6
            ? 'text-white shadow-md shadow-amber-900/80 ring-2 ring-amber-300/50 font-bold drop-shadow relative overflow-hidden'
            : toChangeTextColorIfNeeds(getTaskGradeLabel(grade))}
            {data.myVote?.grade === grade
            ? 'ring-2 ring-offset-1 ring-gray-600 dark:ring-gray-300'
            : 'opacity-80 hover:opacity-100'}"
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
