<script lang="ts">
  import { Button } from 'flowbite-svelte';

  export let width: string = 'w-full';
  export let labelName: string;
</script>

<Button type="submit" class={width}>{labelName}</Button>
