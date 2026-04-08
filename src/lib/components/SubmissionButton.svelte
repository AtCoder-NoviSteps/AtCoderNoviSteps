<script lang="ts">
  import { getContext } from 'svelte';

  import { Button } from 'flowbite-svelte';

  interface Props {
    width?: string;
    labelName: string;
    loading?: boolean;
  }

  let { width = 'w-full', labelName, loading = false }: Props = $props();

  // Get isSubmitting from FormWrapper's context, default to false if undefined.
  const formContext = getContext<{ isSubmitting: boolean } | undefined>('form');
  const isLoading = $derived(loading || (formContext?.isSubmitting ?? false));
</script>

<Button type="submit" class={width} loading={isLoading}>{labelName}</Button>
