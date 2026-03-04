<script lang="ts">
  import { createDroppable } from '@dnd-kit/svelte';
  import KanbanCard from './KanbanCard.svelte';

  interface PlacementCard {
    id: number;
    workBookId: number;
    title: string;
    isPublished: boolean;
  }

  interface Props {
    columnId: string;
    label: string;
    cards: PlacementCard[];
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
  class:dark:bg-gray-800={true}
  class:bg-gray-200={droppable.isDropTarget}
>
  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 sticky top-0 pb-1">
    {label}
    <span class="text-xs font-normal text-gray-500">({cards.length})</span>
  </h3>
  <div class="flex flex-col gap-2 min-h-12">
    {#each cards as card, i (card.id)}
      <KanbanCard
        placementId={card.id}
        index={i}
        title={card.title}
        isPublished={card.isPublished}
        {group}
      />
    {/each}
  </div>
</div>
