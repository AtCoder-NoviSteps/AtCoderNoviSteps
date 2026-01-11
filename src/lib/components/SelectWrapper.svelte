<script lang="ts">
  import { Label, Select } from 'flowbite-svelte';

  interface Props {
    labelClass?: string;
    labelName?: string;
    innerName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any;
    inputValue: unknown;
    isEditable?: boolean;
    onClick?: (event: Event) => void;
  }

  let {
    labelClass = 'flex flex-col gap-2',
    labelName = '',
    innerName,
    items,
    inputValue = $bindable(),
    isEditable = true,
    onClick = () => {},
  }: Props = $props();
</script>

<Label class={labelClass}>
  <span>{labelName}</span>
  <Select
    class=""
    name={innerName}
    {items}
    bind:value={inputValue}
    disabled={!isEditable}
    onclick={onClick}
  />
</Label>
