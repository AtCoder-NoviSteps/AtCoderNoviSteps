import type {
  WorkbooksWithPlacement,
  WorkbookWithPlacement,
} from '$features/workbooks/types/workbook_placement';
import type { KanbanColumns, PlacementUpdate } from '../_types/kanban';

/**
 * Builds a KanbanColumns record from a list of workbooks.
 *
 * @param workbooks - Workbooks with their placement data
 * @param enumKeys - All column keys to initialize (including empty columns)
 * @param getColumnKey - Extracts the column key from a workbook; returns null to exclude
 *
 * @returns A record mapping column keys to arrays of cards, sorted by priority
 */
export function buildKanbanItems(
  workbooks: WorkbooksWithPlacement,
  enumKeys: string[],
  getColumnKey: (workbook: WorkbookWithPlacement) => string | null,
): KanbanColumns {
  const record: KanbanColumns = {};

  for (const key of enumKeys) {
    record[key] = [];
  }

  workbooks
    .filter((workbook) => workbook.placement !== null && getColumnKey(workbook) !== null)
    .sort((a, b) => a.placement!.priority - b.placement!.priority)
    .forEach((workbook) => {
      const column = getColumnKey(workbook)!;

      record[column].push({
        id: workbook.placement!.id,
        workBookId: workbook.id,
        title: workbook.title,
        isPublished: workbook.isPublished,
      });
    });

  return record;
}

/**
 * Compares two KanbanColumns snapshots and returns the placement updates needed
 * to persist the new ordering to the server.
 *
 * @param before - Snapshot taken before the drag operation
 * @param after - Current state after the drag operation
 * @param columnKey - Which placement field ('solutionCategory' | 'taskGrade') to set
 */
export function calcPriorityUpdates(
  before: KanbanColumns,
  after: KanbanColumns,
  columnKey: 'solutionCategory' | 'taskGrade',
): PlacementUpdate[] {
  const updates: PlacementUpdate[] = [];

  for (const [columnId, cards] of Object.entries(after)) {
    const snapCards = before[columnId];
    const isChanged =
      !snapCards ||
      cards.length !== snapCards.length ||
      cards.some((card, i) => card.id !== snapCards[i]?.id);

    if (isChanged) {
      cards.forEach((card, i) => {
        updates.push({
          id: card.id,
          priority: i + 1,
          solutionCategory: null,
          taskGrade: null,
          [columnKey]: columnId,
        });
      });
    }
  }

  return updates;
}

/**
 * Sends placement updates to the server.
 * Throws if the response is not OK.
 */
export async function saveUpdates(updates: PlacementUpdate[]): Promise<void> {
  const res = await fetch('/workbooks/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });

  if (!res.ok) throw new Error('Failed to save');
}
