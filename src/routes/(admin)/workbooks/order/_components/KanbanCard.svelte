<script lang="ts">
  import { createSortable } from '@dnd-kit/svelte/sortable';
  import { Badge } from 'flowbite-svelte';

  interface Props {
    placementId: number;
    workBookId: number;
    index: number;
    title: string;
    isPublished: boolean;
    columnId: string;
    group: string;
  }

  let { placementId, workBookId, index, title, isPublished, columnId, group }: Props = $props();

  const sortable = createSortable({
    get id() {
      return placementId;
    },
    get index() {
      return index;
    },
    group: columnId,
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
    <Badge color="red" class="mb-1">未公開</Badge>
  {/if}

  <a
    href="/workbooks/{workBookId}"
    class="text-sm text-gray-900 dark:text-white font-medium hover:text-green-600 dark:hover:text-green-400"
    onclick={(e) => e.stopPropagation()}
  >
    {title}
  </a>
</div>
