<script lang="ts">
  import { onMount } from 'svelte';

  import { Tooltip } from 'svelte-5-ui-lib';
  import QuestionCircleOutline from 'flowbite-svelte-icons/QuestionCircleOutline.svelte';

  import { TOOLTIP_CLASS_BASE } from '$lib/constants/tailwind-helper';

  interface Props {
    tooltipContent?: string;
  }

  let { tooltipContent = '' }: Props = $props();

  let titleId = $state('');

  onMount(() => {
    titleId = `title-${Math.floor(Math.random() * 10000)}`;
  });
</script>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/tooltip#Placement -->
{#if tooltipContent !== '' && titleId !== ''}
  <Tooltip showOn="hover" triggeredBy={`#${titleId}`} class={`max-w-[200px] ${TOOLTIP_CLASS_BASE}`}>
    {tooltipContent}
  </Tooltip>

  <span id={titleId}>
    <QuestionCircleOutline class="dark:text-white" />
  </span>
{/if}
