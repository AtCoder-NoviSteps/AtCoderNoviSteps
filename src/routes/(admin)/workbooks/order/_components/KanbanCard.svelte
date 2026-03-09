<script lang="ts">
  import { createSortable } from '@dnd-kit/svelte/sortable';

  import PublicationStatusLabel from '$features/workbooks/components/shared/PublicationStatusLabel.svelte';

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
  class="bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 rounded-lg p-3 cursor-grab hover:border-primary-400 touch-none select-none"
  class:opacity-50={sortable.isDragging}
>
  <PublicationStatusLabel {isPublished} />

  <a
    href="/workbooks/{workBookId}"
    class="text-sm font-medium text-primary-700 dark:text-primary-500"
    onclick={(e) => e.stopPropagation()}
  >
    {title}
  </a>
</div>
