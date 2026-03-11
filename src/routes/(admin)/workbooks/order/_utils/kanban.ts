import {
  SOLUTION_LABELS,
  type WorkbooksWithPlacement,
  type WorkbookWithPlacement,
} from '$features/workbooks/types/workbook_placement';
import type {
  ActiveTab,
  KanbanColumns,
  ColumnKey,
  PlacementUpdates,
  TabConfig,
} from '../_types/kanban';

import { getTaskGradeLabel } from '$lib/utils/task';

// Per-tab static configuration; eliminates activeTab === 'solution' branches in DnD handlers
export const TAB_CONFIGS: Record<ActiveTab, TabConfig> = {
  solution: {
    labelFn: (column) => SOLUTION_LABELS[column] ?? column,
    group: 'solution',
    columnKey: 'solutionCategory',
  },
  curriculum: {
    labelFn: getTaskGradeLabel,
    group: 'curriculum',
    columnKey: 'taskGrade',
  },
};

/**
 * Returns a new URL with tab/category/grade search params updated.
 * Pure function — does not call replaceState.
 */
export function buildUpdatedUrl(
  url: URL,
  activeTab: ActiveTab,
  selectedSolutionCategories: string[],
  selectedGrades: string[],
): URL {
  const updatedUrl = new URL(url);
  updatedUrl.searchParams.set('tab', activeTab);

  if (activeTab === 'solution') {
    updatedUrl.searchParams.set('categories', selectedSolutionCategories.join(','));
    updatedUrl.searchParams.delete('grades');
  } else {
    updatedUrl.searchParams.set('grades', selectedGrades.join(','));
    updatedUrl.searchParams.delete('categories');
  }

  return updatedUrl;
}

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
  columnKeys: string[],
  getColumnKey: (workbook: WorkbookWithPlacement) => string | null,
): KanbanColumns {
  const record: KanbanColumns = {};

  for (const key of columnKeys) {
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
export function reCalcPriorities(
  before: KanbanColumns,
  after: KanbanColumns,
  columnKey: ColumnKey,
): PlacementUpdates {
  // The object literal sets both fields to null, then [columnKey]: columnId overrides one.
  // JavaScript evaluates the object as a single expression, so the final value always has
  // exactly one field set to columnId. workBookPlacementSchema also enforces this invariant
  // at the API boundary before any DB write occurs.
  return Object.entries(after).flatMap(([columnId, cards]) => {
    const snapCards = before[columnId];
    const isUpdated =
      !snapCards ||
      cards.length !== snapCards.length ||
      cards.some((card, i) => card.id !== snapCards[i]?.id);

    if (!isUpdated) {
      return [];
    }

    return cards.map((card, i) => ({
      id: card.id,
      priority: i + 1,
      solutionCategory: null,
      taskGrade: null,
      [columnKey]: columnId,
    }));
  });
}

/**
 * Sends placement updates to the server.
 * Throws if the response is not OK.
 */
export async function saveUpdates(updates: PlacementUpdates): Promise<void> {
  const response = await fetch('/workbooks/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });

  if (!response.ok) {
    throw new Error('Failed to save');
  }
}
