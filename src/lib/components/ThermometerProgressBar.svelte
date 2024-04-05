<script lang="ts">
  import type { SubmissionRatios } from '$lib/types/submission';

  export let submissionRatios: SubmissionRatios;
  export let width: string = 'w-7/12 md:w-8/12 lg:w-9/12';

  const baseAttributes =
    'shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center';
</script>

<!-- HACK: 本来であれば、Flowbite SvelteにあるProgressbarのcolor属性で色を指定したいが、同属性の拡張方法が分からないのでFlowbiteのコンポーネントをやむなく利用 -->
<!-- See: -->
<!-- https://flowbite.com/docs/components/progress/ -->
<!-- https://flowbite-svelte.com/docs/pages/typescript -->
<!-- https://flowbite.com/docs/components/progress/ -->
<!-- https://blog.canopas.com/designing-stunning-progress-bars-made-easy-with-tailwind-css-ae620ba7b4be -->
<!-- https://www.creative-tim.com/learning-lab/tailwind-starter-kit/documentation/css/progressbars -->
<!-- <div class="w-7/12 md:w-8/12 lg:w-9/12 rounded-full border border-gray-200 p-1"> -->
<div class="{width} rounded-full border border-gray-200 p-1">
  <div class="rounded-full h-6">
    <div class="overflow-hidden h-6 flex rounded-full bg-white">
      {#each submissionRatios as submissionRatio}
        <div
          style="width: {submissionRatio.ratioPercent}%"
          class={`${baseAttributes} ${submissionRatio.color}`}
        ></div>
      {/each}
    </div>
  </div>
</div>
