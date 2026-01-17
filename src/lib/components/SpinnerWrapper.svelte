<!-- @component
  A wrapper component that displays a centered loading spinner.

  @prop {any} [size=12] - The size of the spinner in pixels
-->
<script lang="ts">
  import { Spinner } from 'flowbite-svelte';

  interface Props {
    // Spinner component type is any, so we have no choice but to use it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    size?: any;
  }

  let { size = '12' }: Props = $props();
</script>

<div class="container mx-auto text-left">
  <Spinner class="m-8" {size} />
</div>
