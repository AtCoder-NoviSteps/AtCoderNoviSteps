<script>
  import { Footer, FooterCopyright } from 'flowbite-svelte';

  // FIXME: Update tsconfig.json.
  // @ts-ignore
  import { PRODUCT_NAME } from '$lib/constants/product-info.ts';
</script>

<!-- FIXME: Expect to be centered because it moves to the left edge when the pixel is less than 768. -->
<Footer>
  <FooterCopyright
    href="/"
    by="{PRODUCT_NAME} team, "
    year={2023}
    spanClass="w-screen text-center"
  />
</Footer>
