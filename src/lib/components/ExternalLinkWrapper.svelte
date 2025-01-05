<script lang="ts">
  import ExternalLinkIcon from '$lib/components/ExternalLinkIcon.svelte';

  export let url: string;
  export let description: string;
  export let textSize: string = '';
  export let textColorInDarkMode = 'dark:text-primary-500';
  export let textOverflow: string = '';
  export let iconSize: number = 4;
</script>

<a
  href={url}
  class={`inline-flex items-center font-medium ${textSize} text-primary-600 hover:underline ${textColorInDarkMode}`}
  target="_blank"
  rel="noreferrer"
>
  <span class={`${textOverflow} truncate`}>
    {description}
  </span>

  <span class="ml-1.5">
    <ExternalLinkIcon size={`w-${iconSize} h-${iconSize}`} />
  </span>
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
