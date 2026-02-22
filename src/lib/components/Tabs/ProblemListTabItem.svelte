<script lang="ts">
  import type { Snippet } from 'svelte';

  import TabItemWrapper from './TabItemWrapper.svelte';

  import {
    activeProblemListTabStore,
    type ActiveProblemListTab,
  } from '$lib/stores/active_problem_list_tab.svelte';

  interface Props {
    activeProblemList: ActiveProblemListTab;
    isOpen?: boolean;
    title: string;
    tooltipContent?: string;
    children?: Snippet;
  }

  let { activeProblemList, isOpen = false, title, tooltipContent = '', children }: Props = $props();
</script>

<TabItemWrapper
  {isOpen}
  {title}
  {tooltipContent}
  onclick={() => activeProblemListTabStore.set(activeProblemList)}
>
  {@render children?.()}
</TabItemWrapper>
