<script lang="ts">
  import { TableHeadCell } from 'flowbite-svelte';

  interface Props {
    paddingX?: string;
  }

  let { paddingX = 'px-1 xs:px-3' }: Props = $props();
</script>

<TableHeadCell
  class="text-left min-w-[240px] max-w-[240px] lg:max-w-[280px] xl:max-w-[360px] 2xl:max-w-[480px] {paddingX}"
>
  タイトル
</TableHeadCell>
