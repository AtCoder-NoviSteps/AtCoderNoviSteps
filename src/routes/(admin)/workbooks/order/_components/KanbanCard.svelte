<script lang="ts">
  import { createSortable } from '@dnd-kit/svelte/sortable';

  import type { Card, SortableProps } from '../_types/kanban';

  import PublicationStatusLabel from '$features/workbooks/components/shared/PublicationStatusLabel.svelte';
  import WorkbookLink from '$features/workbooks/components/shared/WorkbookLink.svelte';

  let {
    id: placementId,
    workBookId,
    title,
    isPublished,
    columnId,
    group,
    index,
  }: Card & SortableProps = $props();

  // See:
  // https://dndkit.com/svelte/primitives/create-sortable#createsortable
  const sortable = createSortable({
    get id() {
      return placementId;
    },
    get index() {
      return index;
    },
    get group() {
      return columnId;
    },
    get type() {
      return group;
    },
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

  <WorkbookLink {workBookId} {title} />
</div>
