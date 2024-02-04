<script lang="ts">
  export let defalutWidth: string = 'w-5/6';
</script>

<div class={`container ${defalutWidth} lg:w-3/4 mx-auto flex flex-col items-center`}>
  <slot />
</div>
