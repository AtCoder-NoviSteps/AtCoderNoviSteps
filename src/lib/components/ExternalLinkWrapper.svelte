<script lang="ts">
  import ExternalLinkIcon from '$lib/components/ExternalLinkIcon.svelte';

  interface Props {
    url: string;
    description: string;
    textSize?: string;
    textColorInDarkMode?: string;
    textOverflow?: string;
    iconSize?: number;
    ariaLabel?: string;
    useInlineFlex?: boolean;
  }

  let {
    url,
    description,
    textSize = '',
    textColorInDarkMode = 'dark:text-primary-500',
    textOverflow = '',
    iconSize = 4,
    ariaLabel = '',
    useInlineFlex = true,
  }: Props = $props();
</script>

<a
  href={url}
  class={`${useInlineFlex ? 'inline-flex' : ''} items-center font-medium ${textSize} text-primary-600 hover:underline ${textColorInDarkMode}`}
  aria-label={ariaLabel}
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
