<script lang="ts">
  import { Label, Tooltip } from 'flowbite-svelte';
  import QuestionCircleOutline from 'flowbite-svelte-icons/QuestionCircleOutline.svelte';

  export let labelName: string;
  export let tooltipId: string;
  export let tooltipContents: string | string[];
  export let tooltipWidth: number = 280;
</script>

<Label>
  <div class="flex items-center space-x-2">
    <span>{labelName}</span>
    <Tooltip type="auto" triggeredBy="#{tooltipId}" class="max-w-[{tooltipWidth}px]">
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
