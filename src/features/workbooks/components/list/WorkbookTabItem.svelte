<script lang="ts">
  import type { Snippet } from 'svelte';

  import TabItemWrapper from '$lib/components/Tabs/TabItemWrapper.svelte';

  import { WorkBookType } from '$features/workbooks/types/workbook';
  import { activeWorkbookTabStore } from '$features/workbooks/stores/active_workbook_tab';

  interface Props {
    workbookType: WorkBookType;
    isOpen?: boolean;
    title: string;
    tooltipContent?: string;
    children?: Snippet;
  }

  let { workbookType, isOpen = false, title, tooltipContent = '', children }: Props = $props();
</script>

<TabItemWrapper
  {isOpen}
  {title}
  {tooltipContent}
  onclick={() => activeWorkbookTabStore.setActiveWorkbookTab(workbookType)}
>
  {@render children?.()}
</TabItemWrapper>
