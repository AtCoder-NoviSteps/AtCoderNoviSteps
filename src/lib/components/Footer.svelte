<script lang="ts">
  import { Footer, FooterCopyright } from 'flowbite-svelte';

  import { PRODUCT_NAME } from '$lib/constants/product-info';
</script>

<!-- FIXME: Expect to be centered because it moves to the left edge when the pixel is less than 768. -->
<Footer class="shadow-none w-screen text-center m-6">
  <FooterCopyright href="/" by="{PRODUCT_NAME} team, " year={2023} />
</Footer>
