<script lang="ts">
  import { Tooltip } from 'flowbite-svelte';

  import type { TaskGrade } from '$lib/types/task';
  import {
    calcGradeDiff,
    getRelativeEvaluationLabel,
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

  const label = $derived(getRelativeEvaluationLabel(calcGradeDiff(officialGrade, medianGrade)));
  const isHarder = $derived(label.startsWith('+'));

  const tooltipText = $derived.by(() => {
    switch (label) {
      case '++':
        return '投票中央値が公式グレードより2段階以上高い（難しい）';
      case '+':
        return '投票中央値が公式グレードより1段階高い（難しい）';
      case '-':
        return '投票中央値が公式グレードより1段階低い（易しい）';
      case '--':
        return '投票中央値が公式グレードより2段階以上低い（易しい）';
      default:
        return '';
    }
  });
</script>

{#if label}
  <span
    id={badgeId}
    class="absolute -top-2 -right-2 z-10 rounded-full px-1 py-px text-[0.65rem] font-bold leading-none tracking-wider shadow-sm
      {isHarder
      ? 'bg-orange-200 text-orange-800 dark:bg-orange-800/70 dark:text-orange-200'
      : 'bg-sky-200 text-sky-800 dark:bg-sky-800/70 dark:text-sky-200'}"
    aria-hidden={!showTooltip}
    role={showTooltip ? 'img' : undefined}
    aria-label={showTooltip ? tooltipText : undefined}
    tabindex={showTooltip ? 0 : undefined}
  >
    {label}
  </span>
  {#if showTooltip && tooltipText}
    <Tooltip triggeredBy="#{badgeId}" placement="top">
      {tooltipText}
    </Tooltip>
  {/if}
{/if}
