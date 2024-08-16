<script lang="ts">
  export let url: string;
  export let description: string;
</script>

<a
  href={url}
  class="font-medium xs:text-lg text-primary-600 hover:underline dark:text-gray-300"
  target="_blank"
  rel="noreferrer"
>
  {description}
</a>
