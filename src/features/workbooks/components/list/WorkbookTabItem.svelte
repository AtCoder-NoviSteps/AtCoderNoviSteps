<script lang="ts">
  import type { Snippet } from 'svelte';
  import TabItemWrapper from '$lib/components/Tabs/TabItemWrapper.svelte';

  interface Props {
    isOpen?: boolean;
    title: string;
    tooltipContent?: string;
    children?: Snippet;
    onclick?: () => void;
  }

  let { isOpen = false, title, tooltipContent = '', children, onclick }: Props = $props();
</script>

<TabItemWrapper {isOpen} {title} {tooltipContent} {onclick}>
  {@render children?.()}
</TabItemWrapper>
