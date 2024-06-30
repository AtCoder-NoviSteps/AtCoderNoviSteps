<script lang="ts">
  import { TabItem } from 'flowbite-svelte';
  import QuestionCircleOutline from 'flowbite-svelte-icons/QuestionCircleOutline.svelte';

  import * as Tooltip from '$lib/components/ui/tooltip';

  export let isOpen: boolean = false;
  export let title: string;
  export let tooltipContent: string = '';
</script>

<!-- See: -->
<!-- https://www.shadcn-svelte.com/docs/components/tooltip -->
<TabItem open={isOpen}>
  <span slot="title" class="text-lg">
    {#if tooltipContent === ''}
      {title}
    {:else}
      <Tooltip.Root>
        <Tooltip.Trigger class="flex items-center space-x-2">
          <span>{title}</span>
          <QuestionCircleOutline />
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>{tooltipContent}</p>
        </Tooltip.Content>
      </Tooltip.Root>
    {/if}
  </span>
  <slot />
</TabItem>
