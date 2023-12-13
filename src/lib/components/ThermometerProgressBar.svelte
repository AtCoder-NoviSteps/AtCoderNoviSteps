<script lang="ts">
  export let gradeColor: string;
  export let acceptedRatioPercent: number;
</script>

<!-- HACK: 本来であれば、Flowbite SvelteにあるProgressbarのcolor属性で色を指定したいが、同属性の拡張方法が分からないのでFlowbiteのコンポーネントをやむなく利用 -->
<!-- See: -->
<!-- https://flowbite.com/docs/components/progress/ -->
<!-- https://flowbite-svelte.com/docs/pages/typescript -->
<!-- https://flowbite.com/docs/components/progress/ -->
<!-- https://blog.canopas.com/designing-stunning-progress-bars-made-easy-with-tailwind-css-ae620ba7b4be -->
<div class="w-7/12 md:w-8/12 lg:w-9/12 rounded-full border border-gray-200 p-1">
  <div class="rounded-full h-6">
    <div class={`${gradeColor} h-6 rounded-full`} style={`width: ${acceptedRatioPercent}%`}></div>
  </div>
</div>
