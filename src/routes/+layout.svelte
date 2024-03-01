<script lang="ts">
  import '../app.css';

  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';

  export let data;

  $: isAdmin = data.isAdmin;
</script>

<Header {isAdmin} />

<slot />

<Footer />
