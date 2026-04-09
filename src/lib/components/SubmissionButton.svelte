<script lang="ts">
  import { getContext } from 'svelte';

  import { Button } from 'flowbite-svelte';
  import type { ButtonColor } from '$lib/types/flowbite-svelte-wrapper';

  interface Props {
    width?: string;
    labelName: string;
    loading?: boolean;
    color?: ButtonColor;
  }

  let { width = 'w-full', labelName, loading = false, color = 'primary' }: Props = $props();

  // Get isSubmitting from FormWrapper's context, default to false if undefined.
  const formContext = getContext<{ isSubmitting: boolean } | undefined>('form');
  const isLoading = $derived(loading || (formContext?.isSubmitting ?? false));
</script>

<Button type="submit" {color} class={width} loading={isLoading}>{labelName}</Button>
