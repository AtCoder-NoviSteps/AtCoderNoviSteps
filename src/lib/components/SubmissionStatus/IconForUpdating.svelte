<script lang="ts">
  // @ts-ignore
  import ChevronDownOutline from 'flowbite-svelte-icons/ChevronDownOutline.svelte';

  export let isLoggedIn: boolean;
</script>

<!-- HACK: 以下のコンポーネントと類似しているが、差分が大きいため別コンポーネントとして用意 -->
<!-- src/lib/components/SubmissionStatus/SubmissionStatusImage.svelte -->
{#if isLoggedIn}
  <div class="flex items-center text-sm">
    <div class="dark:text-gray-300">
      {'更新'}
    </div>

    <ChevronDownOutline class="w-5 h-5 text-primary-600 dark:text-gray-300 inline" />
  </div>
{/if}
