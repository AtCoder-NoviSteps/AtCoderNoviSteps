<script lang="ts">
  import { onMount } from 'svelte';

  import { Tooltip } from 'flowbite-svelte';
  import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';

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
  <Tooltip type="auto" triggeredBy={`#${titleId}`} class={`max-w-[200px] ${TOOLTIP_CLASS_BASE}`}>
    {tooltipContent}
  </Tooltip>

  <span id={titleId}>
    <CircleQuestionMark class="w-5 h-5 dark:text-gray-200" />
  </span>
{/if}
