<script lang="ts">
  import { Tooltip } from 'flowbite-svelte';

  import type { TaskGrade } from '$lib/types/task';
  import {
    calcGradeDiff,
    getRelativeEvaluationLabel,
    getRelativeEvaluationTooltipText,
    getRelativeEvaluationBadgeColorClass,
  } from '$features/votes/utils/relative_evaluation';

  interface Props {
    officialGrade: TaskGrade;
    medianGrade: TaskGrade;
    /** Unique element ID used to anchor the Tooltip. Must be unique on the page. */
    badgeId: string;
    /**
     * Set to false when the badge is rendered inside a `<button>`.
     * The tooltip is suppressed and aria-hidden is applied since the
     * parent button's sr-only text already covers screen reader needs.
     * Default: true
     */
    showTooltip?: boolean;
  }

  let { officialGrade, medianGrade, badgeId, showTooltip = true }: Props = $props();

  const diff = $derived(calcGradeDiff(officialGrade, medianGrade));
  const label = $derived(getRelativeEvaluationLabel(diff));
  const badgeColorClass = $derived(getRelativeEvaluationBadgeColorClass(diff));

  const tooltipText = $derived(getRelativeEvaluationTooltipText(label));
</script>

{#if label}
  <span
    id={badgeId}
    class="absolute -top-2 -right-2 z-10 rounded-full px-1 py-px text-[0.65rem] font-bold leading-none shadow-sm {badgeColorClass}"
    aria-hidden={!showTooltip}
    role={showTooltip ? 'img' : undefined}
    aria-label={showTooltip ? tooltipText : undefined}
  >
    {#if label === '--'}
      -&thinsp;-
    {:else if label === '++'}
      +&thinsp;+
    {:else}
      {label}
    {/if}
  </span>
  {#if showTooltip && tooltipText}
    <Tooltip triggeredBy="#{badgeId}" placement="top">
      {tooltipText}
    </Tooltip>
  {/if}
{/if}
