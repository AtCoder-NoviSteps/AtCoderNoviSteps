<script lang="ts">
  import { enhance } from '$app/forms';

  export let method: string = 'POST';
  export let action: string;
  export let marginTop: string = 'mt-6';
  export let spaceYAxis: string = 'space-y-6';
</script>

<form {method} {action} class={`w-full max-w-md ${marginTop} ${spaceYAxis}`} use:enhance>
  <slot />
</form>
