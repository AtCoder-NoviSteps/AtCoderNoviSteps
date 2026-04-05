import { TaskGrade } from '$lib/types/task';
import { WorkBookTab, DEFAULT_WORKBOOK_TAB } from '$features/workbooks/types/workbook';
import {
  SolutionCategory,
  ALL_SOLUTION_CATEGORIES,
  type SelectedSolutionCategory,
} from '$features/workbooks/types/workbook_placement';

const DEFAULT_CURRICULUM_GRADE = TaskGrade.Q10;
const EXISTING_TABS = new Set<string>(Object.values(WorkBookTab));

/**
 * Parses the `?tab=` URL parameter into a WorkBookTab.
 * Falls back to the default ('curriculum') for missing or invalid values.
 *
 * @param params - URL search params to read from
 */
export function parseWorkBookTab(params: URLSearchParams): WorkBookTab {
  const param = params.get('tab');

  if (param !== null && EXISTING_TABS.has(param)) {
    return param as WorkBookTab;
  }

  return DEFAULT_WORKBOOK_TAB;
}

/**
 * Parses the `?grades=` URL parameter into a TaskGrade.
 * Excludes PENDING. Falls back to Q10 for missing or invalid values.
 *
 * @param params - URL search params to read from
 */
export function parseWorkBookGrade(params: URLSearchParams): TaskGrade {
  const param = params.get('grades');

  if (isValidNonPending(param, Object.values(TaskGrade), TaskGrade.PENDING)) {
    return param;
  }

  return DEFAULT_CURRICULUM_GRADE;
}

/**
 * Parses the `?categories=` URL parameter into a SelectedSolutionCategory.
 * Returns null (all categories) when the parameter is absent, invalid, or PENDING.
 * PENDING is excluded because it is admin-only and managed via the order page, not via URL.
 *
 * @param params - URL search params to read from
 */
export function parseWorkBookCategory(params: URLSearchParams): SelectedSolutionCategory {
  const param = params.get('categories');
  return isSelectableCategory(param) ? param : ALL_SOLUTION_CATEGORIES;
}

/**
 * Builds the `/workbooks` URL with the given tab, grade, and category as query parameters.
 * CREATED_BY_USER tab does not append additional params.
 *
 * @param tab - Active tab
 * @param grade - Selected grade (only appended when tab === CURRICULUM)
 * @param category - Selected category (only appended when tab === SOLUTION)
 * @returns URL string suitable for use with goto()
 */
export function buildWorkbooksUrl(
  tab: WorkBookTab,
  grade?: TaskGrade,
  category?: SelectedSolutionCategory,
): string {
  const params = new URLSearchParams();
  params.set('tab', tab);

  if (tab === WorkBookTab.CURRICULUM && grade) {
    params.set('grades', grade);
  } else if (tab === WorkBookTab.SOLUTION && category) {
    // When category is null (ALL), it is falsy and not appended to params
    params.set('categories', category);
  }

  return `/workbooks?${params}`;
}

/**
 * Returns true when `param` is a valid enum value excluding PENDING.
 * Extracted to avoid repeating the same three-condition check for grades and categories.
 */
function isValidNonPending<T extends string>(
  param: string | null,
  values: T[],
  pending: T,
): param is T {
  return param !== null && (values as string[]).includes(param) && param !== pending;
}

/** Returns true when category is a SolutionCategory selectable via URL (excludes PENDING). */
function isSelectableCategory(
  category: string | null,
): category is Exclude<SolutionCategory, 'PENDING'> {
  return (
    category !== null &&
    (Object.values(SolutionCategory) as string[]).includes(category) &&
    category !== SolutionCategory.PENDING
  );
}
