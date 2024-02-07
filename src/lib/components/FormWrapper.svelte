<script lang="ts">
  export let method: string = 'POST';
  export let action: string;
  export let marginTop: string = 'mt-6';
  export let spaceYAxis: string = 'space-y-6';
</script>

<form {method} {action} class={`w-full max-w-md ${marginTop} ${spaceYAxis}`}>
  <slot />
</form>
