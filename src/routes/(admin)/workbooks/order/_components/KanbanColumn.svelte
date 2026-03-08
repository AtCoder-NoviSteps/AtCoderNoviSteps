<script lang="ts">
  import { createDroppable } from '@dnd-kit/svelte';

  import KanbanCard from './KanbanCard.svelte';

  import type { CardData } from '../_types/kanban';

  interface Props {
    columnId: string;
    label: string;
    cards: CardData[];
    group: string;
  }

  let { columnId, label, cards, group }: Props = $props();

  const droppable = createDroppable({
    get id() {
      return columnId;
    },
    type: group,
    collisionPriority: 1, // CollisionPriority.Low
    accept: group,
  });

  function attachDroppable(node: HTMLElement): { destroy: () => void } {
    const cleanup = droppable.attach(node);
    return { destroy: cleanup };
  }
</script>

<div
  use:attachDroppable
  class="min-w-64 w-64 shrink-0 rounded-lg p-3 flex flex-col gap-2"
  class:bg-gray-100={!droppable.isDropTarget}
  class:dark:bg-gray-700={!droppable.isDropTarget}
  class:bg-gray-200={droppable.isDropTarget}
  class:dark:bg-gray-600={droppable.isDropTarget}
>
  <h3 class="text-base font-semibold text-gray-700 dark:text-gray-300 sticky top-0 pb-1">
    {label}
    <span class="text-sm font-normal text-gray-500">({cards.length})</span>
  </h3>
  <div class="flex flex-col gap-2 min-h-12 overflow-y-auto max-h-[60vh]">
    {#each cards as card, i (card.id)}
      <KanbanCard
        placementId={card.id}
        workBookId={card.workBookId}
        index={i}
        title={card.title}
        isPublished={card.isPublished}
        {columnId}
        {group}
      />
    {/each}
  </div>
</div>
