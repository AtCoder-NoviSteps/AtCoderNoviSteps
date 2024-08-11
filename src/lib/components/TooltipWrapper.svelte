<script lang="ts">
  import { onMount } from 'svelte';

  import { Tooltip } from 'flowbite-svelte';
  import QuestionCircleOutline from 'flowbite-svelte-icons/QuestionCircleOutline.svelte';

  export let tooltipContent: string = '';

  let titleId = '';

  onMount(() => {
    titleId = `title-${Math.floor(Math.random() * 10000)}`;
  });
</script>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/tooltip#Placement -->
{#if tooltipContent !== '' && titleId !== ''}
  <Tooltip type="auto" triggeredBy={`#${titleId}`} class="max-w-[200px]">
    {tooltipContent}
  </Tooltip>

  <span id={titleId}>
    <QuestionCircleOutline class="dark:text-white" />
  </span>
{/if}
