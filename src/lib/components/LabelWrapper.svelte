<script lang="ts">
  import { Label, Input } from 'svelte-5-ui-lib';

  interface Props {
    labelName: string;
    innerName?: string;
    inputValue: string;
  }

  let { labelName, innerName = '', inputValue = $bindable() }: Props = $props();
</script>

<Label class="space-y-2">
  <span>{labelName}</span>
  <Input size="md" disabled readonly name={innerName} bind:value={inputValue} />
</Label>
