<script lang="ts">
  import { Tooltip } from 'svelte-5-ui-lib';
  import Lightbulb from '@lucide/svelte/icons/lightbulb';

  import { TOOLTIP_CLASS_BASE } from '$lib/constants/tailwind-helper';

  interface Props {
    uniqueId: string;
    commentAndHint: string;
  }

  let { uniqueId, commentAndHint }: Props = $props();
</script>

{#if uniqueId !== '' && commentAndHint !== ''}
  <!-- HACK: Position values other than the default "top" cause the tooltip to display only momentarily -->
  <Tooltip
    showOn="hover"
    arrow={false}
    offset={0}
    triggeredBy={`#${uniqueId}`}
    class={`${TOOLTIP_CLASS_BASE}`}
  >
    <div class="whitespace-normal break-words min-w-[150px] max-w-[200px]">
      {commentAndHint}
    </div>
  </Tooltip>

  <span id={uniqueId}>
    <Lightbulb class="w-6 h-6 text-gray-700 dark:text-gray-300" size="lg" />
  </span>
{/if}
