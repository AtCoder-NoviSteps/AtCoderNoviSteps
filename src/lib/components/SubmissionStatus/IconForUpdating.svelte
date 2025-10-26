<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  interface Props {
    isLoggedIn: boolean;
  }

  let { isLoggedIn }: Props = $props();
</script>

<!-- HACK: 以下のコンポーネントと類似しているが、差分が大きいため別コンポーネントとして用意 -->
<!-- src/lib/components/SubmissionStatus/SubmissionStatusImage.svelte -->
{#if isLoggedIn}
  <div class="flex items-center justify-center text-sm space-x-1">
    <div class="dark:text-gray-300">更新</div>

    <div class="text-primary-600 dark:text-gray-300 inline">
      <ChevronDown size="16" />
    </div>
  </div>
{/if}
