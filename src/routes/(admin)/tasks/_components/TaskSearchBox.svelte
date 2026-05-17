<script lang="ts">
  import { Input, Label } from 'flowbite-svelte';

  interface Props {
    value: string;
    placeholder?: string;
  }

  let { value = $bindable(), placeholder = 'コンテストID・コンテスト名・問題名で検索' }: Props =
    $props();
</script>

<div class="flex flex-col gap-1">
  <Label for="task-search">検索</Label>
  <Input id="task-search" type="text" bind:value {placeholder} />
</div>
