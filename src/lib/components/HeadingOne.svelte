<!-- Note: The default setting for STWUI is too bold for h1 text,
  so I reverted to the default for Flowbite Svelte. -->
<script lang="ts">
  // See:
  // https://stwui.vercel.app/typography
  export let title: string;
  export let textSize: string = 'text-3xl';
  export let fontWeight: string = 'font-normal';
</script>

<h1 class={`${textSize} ${fontWeight} truncate`}>
  {title}
  <slot />
</h1>
