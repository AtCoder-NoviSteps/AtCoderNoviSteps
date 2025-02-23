<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Snippet } from 'svelte';

  // See:
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attributes_for_form_submission
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
</script>

<form {method} {action} class={`w-full max-w-md ${marginTop} ${spaceYAxis}`} use:enhance>
  {#if children}
    {@render children()}
  {/if}
</form>
