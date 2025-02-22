<script lang="ts">
  import { type Snippet, onMount } from 'svelte';

  import { TabItem, Tooltip } from 'svelte-5-ui-lib';
  import QuestionCircleOutline from 'flowbite-svelte-icons/QuestionCircleOutline.svelte';

  import { WorkBookType } from '$lib/types/workbook';
  import { activeWorkbookTabStore } from '$lib/stores/active_workbook_tab';

  import { TOOLTIP_CLASS_BASE } from '$lib/constants/tailwind-helper';

  interface Props {
    workbookType: WorkBookType | null;
    isOpen?: boolean;
    title: string;
    tooltipContent?: string;
    children?: Snippet;
  }

  let {
    workbookType = null,
    isOpen = false,
    title,
    tooltipContent = '',
    children,
  }: Props = $props();

  let titleId = $state('');

  onMount(() => {
    titleId = `title-${Math.floor(Math.random() * 10000)}`;
  });

  function handleClick(workBookType: WorkBookType | null): void {
    if (workBookType === null) return;

    activeWorkbookTabStore.setActiveWorkbookTab(workBookType);
  }
</script>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/tooltip#Placement -->
<!-- https://svelte-5-ui-lib.codewithshin.com/components/tooltip -->
<div>
  {#if tooltipContent !== '' && titleId !== ''}
    <Tooltip
      showOn="hover"
      triggeredBy={`#${titleId}`}
      class={`max-w-[200px] ${TOOLTIP_CLASS_BASE}`}
    >
      {tooltipContent}
    </Tooltip>
  {/if}
</div>

<!-- See: -->
<!-- https://svelte-5-ui-lib.codewithshin.com/components/tabs -->
<TabItem open={isOpen} onclick={() => handleClick(workbookType)}>
  {#snippet titleSlot()}
    <span class="text-lg" id={titleId}>
      <div class="flex items-center space-x-2">
        <span>
          {title}
        </span>

        {#if tooltipContent !== ''}
          <QuestionCircleOutline />
        {/if}
      </div>
    </span>
  {/snippet}

  {@render children?.()}
</TabItem>
