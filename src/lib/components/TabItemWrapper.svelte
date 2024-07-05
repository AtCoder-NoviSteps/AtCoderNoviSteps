<script lang="ts">
  import { TabItem, Tooltip } from 'flowbite-svelte';
  import QuestionCircleOutline from 'flowbite-svelte-icons/QuestionCircleOutline.svelte';
  import { onMount } from 'svelte';

  export let isOpen: boolean = false;
  export let title: string;
  export let tooltipContent: string = '';

  let titleId = '';

  onMount(() => {
    titleId = `title-${Math.floor(Math.random() * 10000)}`;
  });
</script>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/tooltip#Placement -->
<div>
  {#if tooltipContent !== '' && titleId !== ''}
    <Tooltip type="auto" triggeredBy={`#${titleId}`} class="max-w-[200px]">
      {tooltipContent}
    </Tooltip>
  {/if}
</div>

<TabItem open={isOpen}>
  <span slot="title" class="text-lg" id={titleId}>
    <div class="flex items-center space-x-2">
      <span>
        {title}
      </span>

      {#if tooltipContent !== ''}
        <QuestionCircleOutline />
      {/if}
    </div>
  </span>
  <slot />
</TabItem>
