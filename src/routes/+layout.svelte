<script lang="ts">
  // See:
  // https://github.com/oekazuma/svelte-meta-tags
  import { page } from '$app/stores';
  import { MetaTags } from 'svelte-meta-tags';
  import extend from 'just-extend';

  import '../app.css';

  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';

  export let data;

  $: metaTags = extend(true, {}, data.baseMetaTags, $page.data.pageMetaTags);
</script>

<Header />

<MetaTags {...metaTags} />

<slot />

<Footer />
