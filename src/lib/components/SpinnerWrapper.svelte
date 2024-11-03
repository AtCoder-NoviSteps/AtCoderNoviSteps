<script lang="ts">
  import Spinner from 'flowbite-svelte/Spinner.svelte';

  export let size = 12;
</script>

<div class="container mx-auto text-left">
  <Spinner class="m-8" {size} />
</div>
