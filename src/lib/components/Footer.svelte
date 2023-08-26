<script>
  import { Footer, FooterCopyright } from 'flowbite-svelte';
</script>

<!-- FIXME: Use consts. -->
<!-- FIXME: Expect to be centered because it moves to the left edge when the pixel is less than 768. -->
<Footer>
  <FooterCopyright
    href="/"
    by="AtCoder HogeHoges team, "
    year={2023}
    spanClass="w-screen text-center"
  />
</Footer>
