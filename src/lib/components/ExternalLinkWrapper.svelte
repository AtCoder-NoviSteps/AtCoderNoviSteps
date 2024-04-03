<script lang="ts">
  export let url: string;
  export let description: string;
</script>

<a
  href={url}
  class="font-medium text-primary-600 hover:underline dark:text-primary-500"
  target="_blank"
  rel="noreferrer"
>
  {description}
</a>
