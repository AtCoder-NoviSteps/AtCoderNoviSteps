<script lang="ts">
  import { Footer, FooterCopyright } from 'svelte-5-ui-lib';

  import { PRODUCT_TEAM_URL, PRODUCT_NAME } from '$lib/constants/product-info';
</script>

<!-- See: -->
<!-- https://svelte-5-ui-lib.codewithshin.com/components/footer -->
<Footer class="shadow-none w-screen m-6" footerType="logo">
  <div class="flex items-center justify-center">
    <FooterCopyright href={PRODUCT_TEAM_URL} by="{PRODUCT_NAME} team, " />
  </div>
</Footer>
