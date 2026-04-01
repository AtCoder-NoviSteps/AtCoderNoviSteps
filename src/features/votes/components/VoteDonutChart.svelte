<script lang="ts">
  import type { VotedGradeCounter } from '@prisma/client';
  import { getTaskGradeColor, getTaskGradeLabel } from '$lib/utils/task';
  import { nonPendingGrades } from '$features/votes/utils/grade_options';
  import { buildDonutSegments, arcPath, MIN_LABEL_PCT } from '$features/votes/utils/donut_chart';

  interface Props {
    counters: VotedGradeCounter[];
    totalVotes: number;
  }
  let { counters, totalVotes }: Props = $props();

  const CX = 130;
  const CY = 130;
  const OUTER_RADIUS = 90;
  const INNER_RADIUS = 55;
  const LABEL_RADIUS = 115;

  const segments = $derived(
    buildDonutSegments(nonPendingGrades, counters, getTaskGradeColor, getTaskGradeLabel),
  );
</script>

<svg viewBox="0 0 260 260" class="w-full max-w-xs mx-auto" role="img" aria-label="投票分布円グラフ">
  <title>投票分布</title>

  {#if totalVotes === 0}
    <!-- Show empty ring when there are no votes -->
    <circle
      cx={CX}
      cy={CY}
      r={OUTER_RADIUS}
      fill="none"
      stroke="currentColor"
      stroke-width={OUTER_RADIUS - INNER_RADIUS}
      class="text-gray-200 dark:text-gray-700"
      opacity="0.5"
    />
  {:else}
    {#each segments as seg (seg.grade)}
      <path
        d={arcPath(CX, CY, OUTER_RADIUS, INNER_RADIUS, seg.startAngle, seg.endAngle)}
        fill={seg.color}
      />
    {/each}

    {#each segments as seg (seg.grade)}
      {#if seg.pct / 100 >= MIN_LABEL_PCT}
        {@const labelX = CX + LABEL_RADIUS * Math.cos(seg.midAngle)}
        {@const labelY = CY + LABEL_RADIUS * Math.sin(seg.midAngle)}
        {@const anchor = Math.cos(seg.midAngle) >= 0 ? 'start' : 'end'}
        <text
          x={labelX}
          y={labelY - 6}
          text-anchor={anchor}
          class="fill-gray-800 dark:fill-gray-200"
          font-size="10"
        >{seg.label}</text>
        <text
          x={labelX}
          y={labelY + 7}
          text-anchor={anchor}
          class="fill-gray-600 dark:fill-gray-400"
          font-size="9"
        >({seg.count}票, {seg.pct}%)</text>
      {/if}
    {/each}
  {/if}

  <!-- Center: total vote count -->
  <text
    x={CX}
    y={CY - 6}
    text-anchor="middle"
    class="fill-gray-800 dark:fill-gray-200"
    font-size="22"
    font-weight="bold"
  >{totalVotes}</text>
  <text
    x={CX}
    y={CY + 12}
    text-anchor="middle"
    class="fill-gray-500 dark:fill-gray-400"
    font-size="10"
  >票</text>
</svg>
