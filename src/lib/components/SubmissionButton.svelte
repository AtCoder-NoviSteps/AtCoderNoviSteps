<script lang="ts">
  import { Button } from 'svelte-5-ui-lib';

  interface Props {
    width?: string;
    labelName: string;
  }

  let { width = 'w-full', labelName }: Props = $props();
</script>

<Button type="submit" class={width}>{labelName}</Button>
