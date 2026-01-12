<script lang="ts">
  import { Label, Input } from 'flowbite-svelte';

  interface Props {
    labelName: string;
    innerName?: string;
    inputValue: string;
  }

  let { labelName, innerName = '', inputValue = $bindable() }: Props = $props();
</script>

<Label class="flex flex-col gap-2">
  <span>{labelName}</span>
  <Input size="md" disabled readonly name={innerName} bind:value={inputValue} />
</Label>
