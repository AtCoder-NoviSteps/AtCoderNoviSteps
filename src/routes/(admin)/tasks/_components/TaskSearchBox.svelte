<script lang="ts">
  import { Input } from 'flowbite-svelte';
  import Search from '@lucide/svelte/icons/search';

  interface Props {
    value: string;
    placeholder?: string;
  }

  let { value = $bindable(), placeholder = 'コンテストID・コンテスト名・問題名で検索' }: Props =
    $props();
</script>

<div class="w-96">
  <div class="relative">
    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <Search class="h-4 w-4 text-gray-400" />
    </div>
    <Input id="task-search" type="text" bind:value {placeholder} class="pl-9" />
  </div>
</div>
