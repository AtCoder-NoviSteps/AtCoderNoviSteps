<script lang="ts">
  import { Label, Tooltip } from 'flowbite-svelte';
  import CircleHelp from '@lucide/svelte/icons/circle-help';

  import { TOOLTIP_CLASS_BASE } from '$lib/constants/tailwind-helper';

  interface Props {
    labelName: string;
    tooltipId: string;
    tooltipContents: string | string[];
    tooltipWidth?: number;
  }

  let { labelName, tooltipId, tooltipContents, tooltipWidth = 280 }: Props = $props();
</script>

<Label>
  <div class="flex items-center space-x-2">
    <span>{labelName}</span>
    <Tooltip
      type="auto"
      triggeredBy="#{tooltipId}"
      class={`[--tooltip-width:${tooltipWidth}px] max-w-[var(--tooltip-width)] ${TOOLTIP_CLASS_BASE}`}
    >
      {#if typeof tooltipContents === 'string'}
        {tooltipContents}
      {:else}
        {#each tooltipContents as tooltipContent}
          {tooltipContent}<br />
        {/each}
      {/if}
    </Tooltip>

    <CircleHelp class="w-5 h-5" id={tooltipId} />
  </div>
</Label>
