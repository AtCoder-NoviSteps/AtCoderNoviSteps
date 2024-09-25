<script lang="ts">
  import { Img } from 'flowbite-svelte';
  // @ts-ignore
  import ChevronDownOutline from 'flowbite-svelte-icons/ChevronDownOutline.svelte';

  import type { TaskResult } from '$lib/types/task';

  export let taskResult: TaskResult;
  export let isLoggedIn: boolean;

  let imagePath = '';
  let imageAlt = '';

  $: if (taskResult) {
    imagePath = `../../${taskResult.submission_status_image_path}`;
    imageAlt = taskResult.submission_status_label_name;
  }
</script>

<Img src={imagePath} alt={imageAlt} class="h-7 xs:h-8 w-7 xs:w-8" />

{#if isLoggedIn}
  <div class="flex flex-col items-center ml-2 md:ml-4 text-xs">
    <div class="pb-1 dark:text-gray-300">
      {'更新'}
    </div>
    <ChevronDownOutline class="w-3 h-3 text-primary-600 dark:text-gray-300 inline" />
  </div>
{/if}
