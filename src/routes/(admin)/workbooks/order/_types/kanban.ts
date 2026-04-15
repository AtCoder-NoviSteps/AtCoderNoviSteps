import type { DragDropManager, Draggable, Droppable } from '@dnd-kit/dom';
import type { DragDropEventMap } from '@dnd-kit/abstract';

import type { WorkBookTab } from '$features/workbooks/types/workbook';

export type DragOverEventArg = DragDropEventMap<Draggable, Droppable, DragDropManager>['dragover'];
export type DragEndEventArg = DragDropEventMap<Draggable, Droppable, DragDropManager>['dragend'];

export type ColumnKey = 'solutionCategory' | 'taskGrade';

/** Tabs available on the admin order page — excludes CREATED_BY_USER which has no placement config. */
export type ActiveTab = Exclude<WorkBookTab, 'created_by_user'>;

// Static per-tab configuration used to eliminate activeTab === 'solution' if-branches
export type TabConfig = {
  labelFn: (column: string) => string;
  group: string;
  columnKey: ColumnKey;
};

export type KanbanColumns = Record<string, Cards>;

// Placement update sent to the server after a drag-and-drop operation
export type PlacementUpdate = {
  id: number;
  priority: number;
  solutionCategory: string | null;
  taskGrade: string | null;
};

export type PlacementUpdates = PlacementUpdate[];

// Props required for dnd-kit sortable positioning
export type SortableProps = {
  columnId: string; // droppable zone ID (the column this card belongs to)
  group: string; // dnd-kit type that restricts drop targets to the same board
  index: number; // position within the column (required by dnd-kit sortable)
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
