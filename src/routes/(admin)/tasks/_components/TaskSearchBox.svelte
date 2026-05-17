<script lang="ts">
  import { Input } from 'flowbite-svelte';

  interface Props {
    value: string;
    placeholder?: string;
  }

  let { value = $bindable(), placeholder = 'コンテストID・コンテスト名・問題名で検索' }: Props =
    $props();
</script>

<div class="flex w-96 flex-col gap-1">
  <Input id="task-search" type="text" bind:value {placeholder} />
</div>
