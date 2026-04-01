<script lang="ts">
  import type { VotedGradeCounter } from '@prisma/client';
  import { TaskGrade } from '$lib/types/task';
  import { getTaskGradeColor, getTaskGradeLabel } from '$lib/utils/task';
  import { nonPendingGrades } from '$features/votes/utils/grade_options';
  import { buildDonutSegments, arcPath } from '$features/votes/utils/donut_chart';

  interface Props {
    counters: VotedGradeCounter[];
    totalVotes: number;
    /** Median grade to indicate with a radial line. Omit when stats are unavailable. */
    medianGrade?: TaskGrade | null;
    /** The grade the current user voted for. Shows a ✅ on the matching segment. */
    votedGrade?: TaskGrade | null;
  }
  let { counters, totalVotes, medianGrade = null, votedGrade = null }: Props = $props();

  const CX = 130;
  const CY = 130;
  const OUTER_RADIUS = 90;
  const INNER_RADIUS = 55;
  const RING_MID_RADIUS = (INNER_RADIUS + OUTER_RADIUS) / 2;

  const segments = $derived(
    buildDonutSegments(nonPendingGrades, counters, getTaskGradeColor, getTaskGradeLabel),
  );
</script>

<svg viewBox="0 0 260 275" class="w-full max-w-md mx-auto" role="img" aria-label="投票分布円グラフ">
  <title>投票分布</title>
  <defs>
    <!-- Metallic gradient for D6 segment, matching the vote button style.
         objectBoundingBox ensures the gradient spans the segment itself. -->
    <linearGradient id="d6-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#432414" />
      <stop offset="40%" stop-color="rgb(120, 113, 108)" />
      <stop offset="70%" stop-color="rgb(217, 119, 6)" />
      <stop offset="100%" stop-color="#432414" />
    </linearGradient>
  </defs>

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
        fill={seg.grade === TaskGrade.D6 ? 'url(#d6-metallic)' : seg.color}
      />
    {/each}

    <!-- Median grade indicator line: the chart starts at the top and the median
         always falls at the 50% cumulative mark, which is fixed at the bottom. -->
    {#if medianGrade}
      <line
        x1={CX}
        y1={CY + INNER_RADIUS}
        x2={CX}
        y2={CY + OUTER_RADIUS}
        stroke="black"
        stroke-width="2.5"
        stroke-linecap="round"
        class="dark:stroke-white"
      />
      <text
        x={CX}
        y={CY + OUTER_RADIUS + 14}
        text-anchor="middle"
        class="fill-gray-700 dark:fill-gray-300"
        font-size="9">中央値</text
      >
    {/if}

    {#each segments as seg (seg.grade)}
      {@const lx = CX + RING_MID_RADIUS * Math.cos(seg.midAngle)}
      {@const ly = CY + RING_MID_RADIUS * Math.sin(seg.midAngle)}
      {#if seg.pct >= 10}
        <text
          x={lx}
          y={ly - 5}
          text-anchor="middle"
          dominant-baseline="middle"
          fill="white"
          stroke="rgba(0,0,0,0.55)"
          stroke-width="2.5"
          paint-order="stroke"
          font-size="9"
          font-weight="bold">{seg.grade === votedGrade ? `✅ ${seg.label}` : seg.label}</text
        >
        <text
          x={lx}
          y={ly + 6}
          text-anchor="middle"
          dominant-baseline="middle"
          fill="white"
          stroke="rgba(0,0,0,0.55)"
          stroke-width="2"
          paint-order="stroke"
          font-size="7.5">{seg.count}票 {seg.pct}%</text
        >
      {:else if seg.pct >= 5}
        <text
          x={lx}
          y={ly}
          text-anchor="middle"
          dominant-baseline="middle"
          fill="white"
          stroke="rgba(0,0,0,0.55)"
          stroke-width="2.5"
          paint-order="stroke"
          font-size="9"
          font-weight="bold">{seg.grade === votedGrade ? `✅ ${seg.label}` : seg.label}</text
        >
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
    font-weight="bold">{totalVotes}</text
  >
  <text
    x={CX}
    y={CY + 12}
    text-anchor="middle"
    class="fill-gray-500 dark:fill-gray-400"
    font-size="10">票</text
  >
</svg>
