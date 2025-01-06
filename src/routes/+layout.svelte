<script lang="ts">
  // See:
  // https://github.com/oekazuma/svelte-meta-tags
  // https://oekazuma.github.io/svelte-meta-tags/ja/migration-guide/
  import { page } from '$app/state';
  import { navigating } from '$app/stores';

  import { MetaTags, deepMerge } from 'svelte-meta-tags';

  import '../app.css';

  import Header from '$lib/components/Header.svelte';
  import GoogleAnalytics from '$lib/components/GoogleAnalytics.svelte';
  import ErrorMessageToast from '$lib/components/ToastWrapper/ErrorMessageToast.svelte';
  import SpinnerWrapper from '$lib/components/SpinnerWrapper.svelte';
  import Footer from '$lib/components/Footer.svelte';

  import { errorMessageStore } from '$lib/stores/error_message';

  export let data;

  $: metaTags = deepMerge(data.baseMetaTags, page.data.pageMetaTags);
</script>

<Header />

<MetaTags {...metaTags} />
<GoogleAnalytics />

<ErrorMessageToast errorMessage={$errorMessageStore} />

<!-- See: -->
<!-- https://svelte.dev/docs/kit/$app-stores#navigating -->
{#if $navigating}
  <SpinnerWrapper />
{:else}
  <slot />
{/if}

<Footer />
