<script lang="ts">
  import ExternalLink from '@lucide/svelte/icons/external-link';

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
    iconSize = 20,
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
    <ExternalLink class="text-primary-600 dark:text-gray-300" size={iconSize} aria-hidden="true" />
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
