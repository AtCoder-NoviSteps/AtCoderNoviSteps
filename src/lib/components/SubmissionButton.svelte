<script lang="ts">
  import { Button } from 'flowbite-svelte';

  export let labelName: string;
</script>

<Button type="submit" class="w-full">{labelName}</Button>
