<script lang="ts">
  import { Button } from 'flowbite-svelte';

  interface Props {
    width?: string;
    labelName: string;
  }

  let { width = 'w-full', labelName }: Props = $props();
</script>

<Button type="submit" class={width}>{labelName}</Button>
