<script lang="ts">
  import { getContext } from 'svelte';

  import { Button } from 'flowbite-svelte';

  interface Props {
    width?: string;
    labelName: string;
    loading?: boolean;
  }

  let { width = 'w-full', labelName, loading = false }: Props = $props();

  // FormWrapper が setContext('form', ...) でセットしている場合、自動的に isSubmitting を受け取る。
  // FormWrapper 外で使う場合は context が undefined になるため ?? false でフォールバック。
  const formContext = getContext<{ isSubmitting: boolean } | undefined>('form');
  const isLoading = $derived(loading || (formContext?.isSubmitting ?? false));
</script>

<Button type="submit" class={width} loading={isLoading}>{labelName}</Button>
