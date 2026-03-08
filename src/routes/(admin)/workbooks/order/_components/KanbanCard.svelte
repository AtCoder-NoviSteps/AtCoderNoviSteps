<script lang="ts">
  import { createSortable } from '@dnd-kit/svelte/sortable';
  import { Badge } from 'flowbite-svelte';

  interface Props {
    placementId: number;
    index: number;
    title: string;
    isPublished: boolean;
    group: string;
  }

  let { placementId, index, title, isPublished, group }: Props = $props();

  const sortable = createSortable({
    get id() {
      return placementId;
    },
    get index() {
      return index;
    },
    group,
    type: group,
  });

  function attachSortable(node: HTMLElement): { destroy: () => void } {
    const cleanup = sortable.attach(node);
    return { destroy: cleanup };
  }
</script>

<div
  use:attachSortable
  data-placement-id={placementId}
  class="bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 rounded-lg p-3 cursor-grab hover:border-green-400 touch-none select-none"
  class:opacity-50={sortable.isDragging}
>
  {#if !isPublished}
    <Badge color="gray" class="mb-1">未公開</Badge>
  {/if}
  <p class="text-sm text-gray-900 dark:text-white font-medium">{title}</p>
</div>
