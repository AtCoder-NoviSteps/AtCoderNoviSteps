import type { WorkbooksList } from '$features/workbooks/types/workbook';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';

export type WorkbookGroup = {
  category: SolutionCategory;
  workbooks: WorkbooksList;
};

/**
 * Groups workbooks by SolutionCategory in enum definition order.
 * Empty groups are excluded from the result.
 *
 * @param workbooks - Flat list of solution workbooks
 * @param categoryMap - Maps workbook ID to its SolutionCategory
 */
export function groupBySolutionCategory(
  workbooks: WorkbooksList,
  categoryMap: Map<number, SolutionCategory>,
): WorkbookGroup[] {
  return Object.values(SolutionCategory)
    .map((category) => ({
      category,
      workbooks: workbooks.filter((workbook) => categoryMap.get(workbook.id) === category),
    }))
    .filter((group) => group.workbooks.length > 0);
}
