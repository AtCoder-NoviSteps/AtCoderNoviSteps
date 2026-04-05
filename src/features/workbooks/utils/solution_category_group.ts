import { Roles } from '$lib/types/user';
import type { WorkbooksList } from '$features/workbooks/types/workbook';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';

export type WorkbookGroup = {
  category: SolutionCategory;
  workbooks: WorkbooksList;
};

export type WorkbookGroups = WorkbookGroup[];

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
): WorkbookGroups {
  return Object.values(SolutionCategory)
    .map((category) => ({
      category,
      workbooks: workbooks.filter((workbook) => categoryMap.get(workbook.id) === category),
    }))
    .filter((group) => group.workbooks.length > 0);
}

/**
 * Filters workbook groups based on user role.
 * Non-admin users do not see PENDING (unclassified) groups.
 *
 * @param groups - List of workbook groups
 * @param role - User role
 */
export function filterGroupsByRole(groups: WorkbookGroups, role: Roles): WorkbookGroups {
  if (role === Roles.ADMIN) {
    return groups;
  }

  return groups.filter((group) => group.category !== SolutionCategory.PENDING);
}
