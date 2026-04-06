<script lang="ts">
  import { enhance } from '$app/forms';
  import { setContext } from 'svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    method?: 'POST' | 'GET' | 'DIALOG' | 'post' | 'get' | 'dialog' | null | undefined;
    action: string;
    marginTop?: string;
    spaceYAxis?: string;
    children?: Snippet;
  }

  let {
    method = 'POST',
    action,
    marginTop = 'mt-6',
    spaceYAxis = 'space-y-6',
    children,
  }: Props = $props();

  let isSubmitting = $state(false);

  setContext('form', {
    get isSubmitting() {
      return isSubmitting;
    },
  });

  function handleEnhance() {
    isSubmitting = true;

    return async ({ update }: { update: () => Promise<void> }) => {
      await update();
      isSubmitting = false;
    };
  }
</script>

<form
  {method}
  {action}
  class={`w-full max-w-md ${marginTop} ${spaceYAxis}`}
  use:enhance={handleEnhance}
>
  {#if children}
    {@render children()}
  {/if}
</form>
