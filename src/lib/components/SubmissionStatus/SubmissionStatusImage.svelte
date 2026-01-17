<script lang="ts">
  import { Img } from 'flowbite-svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  import type { TaskResult } from '$lib/types/task';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
  }

  let { taskResult, isLoggedIn }: Props = $props();

  let imagePath = $state('');
  let imageAlt = $state('');

  $effect(() => {
    if (taskResult) {
      imagePath = `../../${taskResult.submission_status_image_path}`;
      imageAlt = taskResult.submission_status_label_name;
    }
  });
</script>

<Img src={imagePath} alt={imageAlt} class="h-7 w-7 xs:h-8 xs:w-8" />

<!-- TODO: Redirect to login screen when user is not logged in -->
{#if isLoggedIn}
  <div class="flex flex-col items-center ml-2 md:ml-4 text-xs">
    <div class="pb-1 dark:text-gray-300">更新</div>
    <ChevronDown class="w-3 h-3 text-primary-600 dark:text-white inline" />
  </div>
{/if}
