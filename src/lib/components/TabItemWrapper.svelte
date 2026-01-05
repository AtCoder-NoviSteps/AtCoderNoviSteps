<script lang="ts">
  import { type Snippet, onMount } from 'svelte';

  import { TabItem, Tooltip } from 'flowbite-svelte';
  import CircleHelp from '@lucide/svelte/icons/circle-help';

  import { WorkBookType } from '$lib/types/workbook';
  import { activeWorkbookTabStore } from '$lib/stores/active_workbook_tab';
  import {
    activeProblemListTabStore,
    type ActiveProblemListTab,
  } from '$lib/stores/active_problem_list_tab.svelte';

  import { TOOLTIP_CLASS_BASE } from '$lib/constants/tailwind-helper';

  interface Props {
    workbookType?: WorkBookType | null;
    activeProblemList?: ActiveProblemListTab | null;
    isOpen?: boolean;
    title: string;
    tooltipContent?: string;
    children?: Snippet;
  }

  let {
    workbookType = null,
    activeProblemList = null,
    isOpen = false,
    title,
    tooltipContent = '',
    children,
  }: Props = $props();

  let titleId = $state('');

  onMount(() => {
    titleId = `title-${Math.floor(Math.random() * 10000)}`;
  });

  function handleClick(
    workBookType: WorkBookType | null,
    activeProblemList: ActiveProblemListTab | null,
  ): void {
    if (workBookType !== null) {
      activeWorkbookTabStore.setActiveWorkbookTab(workBookType);
    }

    if (activeProblemList !== null) {
      activeProblemListTabStore.set(activeProblemList);
    }
  }
</script>

<!-- See: -->
<!-- https://svelte-5-ui-lib.codewithshin.com/components/tooltip -->
<div>
  {#if tooltipContent !== '' && titleId !== ''}
    <Tooltip type="auto" triggeredBy={`#${titleId}`} class={`max-w-[200px] ${TOOLTIP_CLASS_BASE}`}>
      {tooltipContent}
    </Tooltip>
  {/if}
</div>

<!-- See: -->
<!-- https://svelte-5-ui-lib.codewithshin.com/components/tabs -->
<TabItem open={isOpen} onclick={() => handleClick(workbookType, activeProblemList)}>
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
