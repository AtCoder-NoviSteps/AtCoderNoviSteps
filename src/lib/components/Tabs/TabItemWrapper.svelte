<script lang="ts">
  import { type Snippet, onMount } from 'svelte';

  import { TabItem, Tooltip } from 'flowbite-svelte';
  import CircleHelp from '@lucide/svelte/icons/circle-help';

  import { TOOLTIP_CLASS_BASE } from '$lib/constants/tailwind-helper';

  interface Props {
    isOpen?: boolean;
    title: string;
    tooltipContent?: string;
    onclick?: () => void;
    children?: Snippet;
  }

  let { isOpen = false, title, tooltipContent = '', onclick, children }: Props = $props();

  let titleId = $state('');

  onMount(() => {
    titleId = `title-${Math.floor(Math.random() * 10000)}`;
  });
</script>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/tooltip -->
<div>
  {#if tooltipContent !== '' && titleId !== ''}
    <Tooltip type="auto" triggeredBy={`#${titleId}`} class={`max-w-[200px] ${TOOLTIP_CLASS_BASE}`}>
      {tooltipContent}
    </Tooltip>
  {/if}
</div>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/tabs -->
<TabItem open={isOpen} {onclick}>
  {#snippet titleSlot()}
    <span class="text-lg" id={titleId}>
      <div class="flex items-center space-x-2">
        <span>
          {title}
        </span>

        {#if tooltipContent !== ''}
          <CircleHelp class="w-5 h-5" />
        {/if}
      </div>
    </span>
  {/snippet}

  {@render children?.()}
</TabItem>
