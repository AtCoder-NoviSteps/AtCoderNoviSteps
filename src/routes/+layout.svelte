<script lang="ts">
  // See:
  // https://github.com/oekazuma/svelte-meta-tags
  import { page } from '$app/stores';
  import { MetaTags } from 'svelte-meta-tags';
  import extend from 'just-extend';

  import '../app.css';

  import Header from '$lib/components/Header.svelte';
  import GoogleAnalytics from '$lib/components/GoogleAnalytics.svelte';
  import ErrorMessageToast from '$lib/components/ToastWrapper/ErrorMessageToast.svelte';
  import Footer from '$lib/components/Footer.svelte';

  import { errorMessageStore } from '$lib/stores/error_message';

  export let data;

  $: metaTags = extend(true, {}, data.baseMetaTags, $page.data.pageMetaTags);
</script>

<Header />

<MetaTags {...metaTags} />
<GoogleAnalytics />

<ErrorMessageToast errorMessage={$errorMessageStore} />

<slot />

<Footer />
