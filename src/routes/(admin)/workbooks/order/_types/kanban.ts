import type { DragDropManager, Draggable, Droppable } from '@dnd-kit/dom';
import type { DragDropEvents } from '@dnd-kit/abstract';

// DnD event types derived from dnd-kit abstractions
type DndEvents = DragDropEvents<Draggable, Droppable, DragDropManager>;

export type DragOverEventArg = Parameters<DndEvents['dragover']>[0];
export type DragEndEventArg = Parameters<DndEvents['dragend']>[0];

export type ActiveTab = 'solution' | 'curriculum';

// Static per-tab configuration used to eliminate activeTab === 'solution' if-branches
export type TabConfig = {
  labelFn: (column: string) => string;
  group: string;
  columnKey: 'solutionCategory' | 'taskGrade';
};

export type KanbanColumns = Record<string, Cards>;

// Placement update sent to the server after a drag-and-drop operation
export type PlacementUpdate = {
  id: number;
  priority: number;
  solutionCategory: string | null;
  taskGrade: string | null;
};

// Props required for dnd-kit sortable positioning
export type SortableProps = {
  columnId: string;
  group: string;
  index: number;
};

// Card used in the Kanban board (one card = one WorkBookPlacement)
// Column assignment is implicit in the Record key, not stored on the card.
export type Card = {
  id: number; // placement.id
  workBookId: number;
  title: string;
  isPublished: boolean;
};

export type Cards = Card[];
