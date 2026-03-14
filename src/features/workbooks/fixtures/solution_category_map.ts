import { SolutionCategory } from '$features/workbooks/types/workbook_placement';

/**
 * Maps urlSlug → SolutionCategory for seeding.
 * SOLUTION workbooks not listed here are initially placed as PENDING.
 */
export const solutionCategoryMap: Record<string, SolutionCategory> = {
  'greedy-method': SolutionCategory.SEARCH_SIMULATION,
  'recursive-function': SolutionCategory.SEARCH_SIMULATION,
  'bitmask-brute-force-search': SolutionCategory.SEARCH_SIMULATION,
  'map-dict': SolutionCategory.DATA_STRUCTURE,
  stack: SolutionCategory.DATA_STRUCTURE,
  'ordered-set': SolutionCategory.DATA_STRUCTURE,
  'priority-queue': SolutionCategory.DATA_STRUCTURE,
  'potentialized-union-find': SolutionCategory.GRAPH,
  'number-theory-search': SolutionCategory.NUMBER_THEORY,
};
