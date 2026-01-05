<script lang="ts">
  import { type HTMLInputTypeAttribute } from 'svelte/elements';

  import { Label, Input } from 'flowbite-svelte';

  import MessageHelperWrapper from '$lib/components/MessageHelperWrapper.svelte';

  // HACK: Use any type out of necessity to maintain compatibility with existing code.
  interface Props {
    labelName?: string;
    inputFieldType?: HTMLInputTypeAttribute | null | undefined;
    inputFieldName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputValue: any;
    isEditable?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message?: any;
  }

  let {
    labelName = '',
    inputFieldType = undefined,
    inputFieldName,
    inputValue = $bindable(),
    isEditable = true,
    message = '',
  }: Props = $props();

  let isReadOnly = !isEditable;
</script>

<Label class="space-y-2">
  <span>{labelName}</span>
  <Input
    type={inputFieldType}
    size="md"
    name={inputFieldName}
    bind:value={inputValue}
    {...isReadOnly ? { readonly: true } : {}}
  />
  <MessageHelperWrapper {message} />
</Label>
