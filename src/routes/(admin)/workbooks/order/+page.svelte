<script lang="ts">
  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import KanbanBoard from './_components/KanbanBoard.svelte';

  let { data } = $props();
</script>

<ContainerWrapper defaultWidth="w-full" lgWidth="lg:w-full">
  <div class="w-full p-6">
    <h2 class="text-2xl font-extrabold dark:text-white mb-3">問題集（並び替え）</h2>

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
