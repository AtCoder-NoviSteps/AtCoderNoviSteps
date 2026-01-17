<script lang="ts">
  import { Footer, FooterCopyright } from 'flowbite-svelte';

  import { PRODUCT_TEAM_URL, PRODUCT_NAME } from '$lib/constants/product-info';
</script>

<!-- See: -->
<!-- https://flowbite-svelte.com/docs/components/footer -->
<Footer class="shadow-none m-6">
  <FooterCopyright
    class="flex w-full text-center justify-center gap-1"
    href={PRODUCT_TEAM_URL}
    by="{PRODUCT_NAME} team,"
  />
</Footer>
