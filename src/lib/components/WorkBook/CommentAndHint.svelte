<script lang="ts">
  import { Tooltip } from 'flowbite-svelte';
  import LightbulbOutline from 'flowbite-svelte-icons/LightbulbOutline.svelte';

  export let uniqueId: string;
  export let commentAndHint: string;
</script>

{#if uniqueId !== '' && commentAndHint !== ''}
  <Tooltip type="auto" triggeredBy={`#${uniqueId}`} class="">
    <div class="whitespace-normal min-w-[150px] max-w-[200px]">
      {commentAndHint}
    </div>
  </Tooltip>

  <span id={uniqueId}>
    <LightbulbOutline class="text-gray-700 dark:text-gray-300" size="lg" />
  </span>
{/if}
