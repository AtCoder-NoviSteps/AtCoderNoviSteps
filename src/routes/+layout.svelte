<script lang="ts">
  // See:
  // https://github.com/oekazuma/svelte-meta-tags
  // https://oekazuma.github.io/svelte-meta-tags/ja/migration-guide/
  import { navigating, page } from '$app/state';

  import { MetaTags, deepMerge } from 'svelte-meta-tags';

  import '../app.css';

  import Header from '$lib/components/Header.svelte';
  import GoogleAnalytics from '$lib/components/GoogleAnalytics.svelte';
  import ErrorMessageToast from '$lib/components/ToastWrapper/ErrorMessageToast.svelte';
  import SpinnerWrapper from '$lib/components/SpinnerWrapper.svelte';
  import Footer from '$lib/components/Footer.svelte';

  import { errorMessageStore } from '$lib/stores/error_message';

  let { data, children } = $props();

  let metaTags = $derived(deepMerge(data.baseMetaTags, page.data.pageMetaTags));

  // $app/state's navigating has from === null when no navigation is occurring (unlike $app/stores
  // where the entire object is null). route.id is a route path pattern (e.g. "/workbooks"),
  // so same-route param changes produce equal ids and do not trigger the spinner.
  //
  // See:
  // https://svelte.dev/docs/kit/$app-state#navigating
  function isCrossRouteNavigation(): boolean {
    return navigating.from !== null && navigating.from.route.id !== navigating.to?.route.id;
  }
</script>

<Header />

<MetaTags {...metaTags} />
<GoogleAnalytics />

<ErrorMessageToast errorMessage={$errorMessageStore} />

{#if isCrossRouteNavigation()}
  <SpinnerWrapper />
{:else}
  {@render children?.()}
{/if}

<Footer />
