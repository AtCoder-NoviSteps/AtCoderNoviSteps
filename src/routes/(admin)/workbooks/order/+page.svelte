<script lang="ts">
  import KanbanBoard from './_components/KanbanBoard.svelte';

  let { data } = $props();
</script>

<div class="container mx-auto max-w-full p-6">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-extrabold dark:text-white">問題集の並び順管理</h2>

    {#if data.hasUnplacedWorkbooks}
      <form method="POST" action="?/initializePlacements">
        <button
          type="submit"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
        >
          ボードに問題集を追加
        </button>
      </form>
    {/if}
  </div>

  <KanbanBoard workbooks={data.workbooks} />
</div>
