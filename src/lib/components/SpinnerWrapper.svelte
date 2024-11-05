<!-- @component
  A wrapper component that displays a centered loading spinner.

  @prop {number} [size=12] - The size of the spinner in pixels
-->
<script lang="ts">
  import Spinner from 'flowbite-svelte/Spinner.svelte';

  export let size: number = 12;
</script>

<div class="container mx-auto text-left">
  <Spinner class="m-8" {size} />
</div>
