<script lang="ts">
  interface Props {
    acceptedCount: number;
    allTaskCount: number;
  }

  let { acceptedCount, allTaskCount }: Props = $props();

  const acceptedRatioPercent = $derived(allTaskCount ? (acceptedCount / allTaskCount) * 100 : 0);
</script>

<!-- See: -->
<!-- https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed -->
<div class="text-xs md:text-sm w-min-[72px] w-max-[96px] text-center">
  <div>
    {acceptedCount} / {allTaskCount}
  </div>
  <div>
    {`(${acceptedRatioPercent.toFixed(1)}%)`}
  </div>
</div>
