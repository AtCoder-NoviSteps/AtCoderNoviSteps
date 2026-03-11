<script lang="ts">
  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import KanbanBoard from './_components/KanbanBoard.svelte';

  let { data } = $props();
</script>

<ContainerWrapper defaultWidth="w-full" lgWidth="lg:w-full">
  <div class="w-full lg:pl-6">
    <HeadingOne title="問題集（並び替え）" />

    {#if data.hasUnplacedWorkbooks}
      <form method="POST" action="?/initializePlacements" class="mb-6">
        <button
          type="submit"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
        >
          ボードに問題集を追加
        </button>
      </form>
    {/if}

    <KanbanBoard workbooks={data.workbooks} />
  </div>
</ContainerWrapper>
