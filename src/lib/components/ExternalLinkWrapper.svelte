<script lang="ts">
  export let url: string;
  export let description: string;
  export let textSize: string = '';
  export let textColorInDarkMode = 'dark:text-primary-500';
</script>

<a
  href={url}
  class="font-medium {textSize} text-primary-600 hover:underline {textColorInDarkMode}"
  target="_blank"
  rel="noreferrer"
>
  {description}
</a>

<!-- See: -->
<!-- https://github.com/fastapi/fastapi/blob/master/docs/en/docs/css/custom.css -->
<style>
  a::after {
    /* \00A0 is a non-breaking space
        to make the mark be on the same line as the link
    */
    content: '\00A0[↪]';
    font-family: Roboto, Arial, sans-serif;
    position: relative;
    top: -0.1em;
  }
</style>
