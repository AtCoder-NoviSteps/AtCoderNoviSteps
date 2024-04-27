<script lang="ts">
  import { Label, Input } from 'flowbite-svelte';

  export let labelName: string;
  export let innerName: string = '';
  export let inputValue: string;
</script>

<Label class="space-y-2">
  <span>{labelName}</span>
  <Input size="md" disabled readonly name={innerName} bind:value={inputValue} />
</Label>
