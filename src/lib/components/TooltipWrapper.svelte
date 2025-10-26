<script lang="ts">
  import { onMount } from 'svelte';

  import { Tooltip } from 'svelte-5-ui-lib';
  import CircleHelp from '@lucide/svelte/icons/circle-help';

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

{#if tooltipContent !== '' && titleId !== ''}
  <Tooltip showOn="hover" triggeredBy={`#${titleId}`} class={`max-w-[200px] ${TOOLTIP_CLASS_BASE}`}>
    {tooltipContent}
  </Tooltip>

  <span id={titleId}>
    <CircleHelp class="w-5 h-5 dark:text-gray-200" />
  </span>
{/if}
