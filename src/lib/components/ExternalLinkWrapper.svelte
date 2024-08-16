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
