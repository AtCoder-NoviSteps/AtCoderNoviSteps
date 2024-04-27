<script lang="ts">
  import { Label, Input, type InputType } from 'flowbite-svelte';

  export let labelName: string = '';
  export let inputFieldType: InputType | undefined = undefined;
  export let inputFieldName: string;
  export let inputValue: any;
</script>

<Label class="space-y-2">
  <span>{labelName}</span>
  <Input type={inputFieldType} size="md" name={inputFieldName} bind:value={inputValue} />
</Label>
