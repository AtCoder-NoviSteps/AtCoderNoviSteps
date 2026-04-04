<script lang="ts">
  import type { VotedGradeCounter } from '@prisma/client';
  import { TaskGrade } from '$lib/types/task';
  import type { DonutSegment } from '$features/votes/types/donut_graph';

  import { getTaskGradeColor, getTaskGradeLabel } from '$lib/utils/task';
  import { nonPendingGrades } from '$features/votes/utils/grade_options';
  import {
    buildDonutSegments,
    buildArcPath,
    calcPointOnCircle,
  } from '$features/votes/utils/donut_chart';

  type VotedGradeCounters = VotedGradeCounter[];

  interface Props {
    counters: VotedGradeCounters;
    totalVotes: number;
    /** Median grade to indicate with a radial line. Omit when stats are unavailable. */
    medianGrade?: TaskGrade | null;
    /** The grade the current user voted for. Shows a ✅ on the matching segment. */
    votedGrade?: TaskGrade | null;
  }
  let { counters, totalVotes, medianGrade = null, votedGrade = null }: Props = $props();

  const CX = 160;
  const CY = 155;
  const OUTER_RADIUS = 120;
  const INNER_RADIUS = 50;
  const RING_MID_RADIUS = (INNER_RADIUS + OUTER_RADIUS) / 2;

  const segments = $derived(
    buildDonutSegments(nonPendingGrades, counters, getTaskGradeColor, getTaskGradeLabel),
  );
</script>

<svg viewBox="0 0 320 310" class="w-full max-w-lg mx-auto" role="img" aria-label="投票分布円グラフ">
  <title>投票分布</title>
  <defs>
    <!-- Metallic gradient for D6 segment, matching the vote button style.
         objectBoundingBox ensures the gradient spans the segment itself. -->
    {@render metallicGradient()}
  </defs>

  {#if totalVotes >= 1}
    {#each segments as segment (segment.grade)}
      {@render segmentPath(segment)}
    {/each}

    <!-- Median grade indicator line: the chart starts at the top and the median
         always falls at the 50% cumulative mark, which is fixed at the bottom. -->
    {#if medianGrade}
      {@render medianIndicator()}
    {/if}

    {#each segments as segment (segment.grade)}
      {@render segmentLabel(segment)}
    {/each}
  {:else}
    <!-- Show empty ring when there are no votes -->
    {@render emptyRing()}
  {/if}

  {@render totalVotedCount()}
</svg>

{#snippet metallicGradient()}
  <linearGradient id="d6-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#432414" />
    <stop offset="40%" stop-color="rgb(120, 113, 108)" />
    <stop offset="70%" stop-color="rgb(217, 119, 6)" />
    <stop offset="100%" stop-color="#432414" />
  </linearGradient>
{/snippet}

{#snippet segmentPath(segment: DonutSegment)}
  <path
    d={buildArcPath(
      { x: CX, y: CY },
      OUTER_RADIUS,
      INNER_RADIUS,
      segment.startAngle,
      segment.endAngle,
    )}
    fill={segment.grade === TaskGrade.D6 ? 'url(#d6-metallic)' : segment.color}
  />
{/snippet}

{#snippet medianIndicator()}
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
    font-size="11">中央値</text
  >
{/snippet}

{#snippet segmentLabel(segment: DonutSegment)}
  {@const labelPoint = calcPointOnCircle({ x: CX, y: CY }, RING_MID_RADIUS, segment.midAngle)}
  {@const labelX = labelPoint.x}
  {@const labelY = labelPoint.y}
  {@const label = segment.grade === votedGrade ? `✅ ${segment.label}` : segment.label}

  {#if segment.percentage >= 10}
    <text
      x={labelX}
      y={labelY - 7}
      text-anchor="middle"
      dominant-baseline="middle"
      fill="white"
      stroke="rgba(0,0,0,0.55)"
      stroke-width="2.5"
      paint-order="stroke"
      font-size="11"
      font-weight="bold"
    >
      {label}
    </text>
    <text
      x={labelX}
      y={labelY + 8}
      text-anchor="middle"
      dominant-baseline="middle"
      fill="white"
      stroke="rgba(0,0,0,0.55)"
      stroke-width="2"
      paint-order="stroke"
      font-size="9.5"
    >
      {segment.count}票 ({segment.percentage}%)
    </text>
  {:else if segment.percentage >= 5}
    <text
      x={labelX}
      y={labelY}
      text-anchor="middle"
      dominant-baseline="middle"
      fill="white"
      stroke="rgba(0,0,0,0.55)"
      stroke-width="2.5"
      paint-order="stroke"
      font-size="11"
      font-weight="bold"
    >
      {label}
    </text>
  {/if}
{/snippet}

{#snippet emptyRing()}
  <circle
    cx={CX}
    cy={CY}
    r={RING_MID_RADIUS}
    fill="none"
    stroke="currentColor"
    stroke-width={OUTER_RADIUS - INNER_RADIUS}
    class="text-gray-200 dark:text-gray-700"
    opacity="0.5"
  />
{/snippet}

{#snippet totalVotedCount()}
  <text
    x={CX}
    y={CY - 6}
    text-anchor="middle"
    class="fill-gray-800 dark:fill-gray-200"
    font-size="28"
    font-weight="bold"
  >
    {totalVotes}
  </text>
  <text
    x={CX}
    y={CY + 16}
    text-anchor="middle"
    class="fill-gray-500 dark:fill-gray-400"
    font-size="13"
  >
    票
  </text>
{/snippet}
