<script lang="ts">
  import { Label, Input, type InputType } from 'flowbite-svelte';

  import MessageHelperWrapper from '$lib/components/MessageHelperWrapper.svelte';

  export let labelName: string = '';
  export let inputFieldType: InputType | undefined = undefined;
  export let inputFieldName: string;
  export let inputValue: unknown;
  export let isEditable: boolean = true;
  export let message: unknown = [];

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
