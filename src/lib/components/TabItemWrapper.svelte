<script lang="ts">
  import { TabItem } from 'flowbite-svelte';

  export let isOpen: boolean = false;
  export let title: string;
</script>

<TabItem open={isOpen}>
  <span slot="title" class="text-lg">{title}</span>
  <slot />
</TabItem>
