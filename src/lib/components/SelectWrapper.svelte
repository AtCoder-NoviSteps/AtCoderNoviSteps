<script lang="ts">
  import { Label, Select } from 'flowbite-svelte';

  export let labelName: string = '';
  export let innerName: string;
  export let items;
  export let inputValue: unknown;
</script>

<Label class="space-y-2">
  <span>{labelName}</span>
  <Select class="" name={innerName} {items} bind:value={inputValue} />
</Label>
