<script lang="ts">
  import ExternalLinkIcon from '$lib/components/ExternalLinkIcon.svelte';

  export let url: string;
  export let description: string;
  export let textSize: string = '';
  export let textColorInDarkMode = 'dark:text-primary-500';
  export let textOverflow = '';
  export let iconSize = 4;
</script>

<a
  href={url}
  class="inline-flex items-center font-medium {textSize} text-primary-600 hover:underline {textColorInDarkMode}"
  target="_blank"
  rel="noreferrer"
>
  <div class="{textOverflow} truncate">
    {description}
  </div>

  <div class="ml-1.5">
    <ExternalLinkIcon size="w-{iconSize} h-{iconSize}" />
  </div>
</a>

<!-- See: -->
<!-- https://github.com/fastapi/fastapi/blob/master/docs/en/docs/css/custom.css -->
<style>
  a::after {
    font-family: Roboto, Arial, sans-serif;
    position: relative;
    top: -0.1em;
  }
</style>
