<script lang="ts">
  import { Label, Tooltip } from 'svelte-5-ui-lib';
  import QuestionCircleOutline from 'flowbite-svelte-icons/QuestionCircleOutline.svelte';

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
      showOn="hover"
      triggeredBy="#{tooltipId}"
      class={`max-w-[${tooltipWidth}px] ${TOOLTIP_CLASS_BASE}`}
    >
      {#if typeof tooltipContents === 'string'}
        {tooltipContents}
      {:else}
        {#each tooltipContents as tooltipContent}
          {tooltipContent}<br />
        {/each}
      {/if}
    </Tooltip>
    <QuestionCircleOutline id={tooltipId} />
  </div>
</Label>
