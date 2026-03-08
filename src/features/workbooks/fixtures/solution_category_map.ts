import type { SolutionCategory } from '$features/workbooks/types/workbook_placement';

/**
 * urlSlug → SolutionCategory マッピング（シードデータ用）
 * 未記載の SOLUTION workbook は PENDING として初期配置される
 */
export const solutionCategoryMap: Record<string, SolutionCategory> = {
  stack: 'DATA_STRUCTURE',
  'potentialized-union-find': 'DATA_STRUCTURE',
  'priority-queue': 'DATA_STRUCTURE',
  'map-dict': 'DATA_STRUCTURE',
  'ordered-set': 'DATA_STRUCTURE',
  'bitmask-brute-force-search': 'SEARCH_SIMULATION',
  'greedy-method': 'SEARCH_SIMULATION',
  'recursive-function': 'SEARCH_SIMULATION',
  'number-theory-search': 'NUMBER_THEORY',
};
