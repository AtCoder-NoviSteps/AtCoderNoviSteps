import { describe, test, expect } from 'vitest';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';
import type { WorkbooksList } from '$features/workbooks/types/workbook';
import { groupBySolutionCategory } from './solution_category_group';

// groupBySolutionCategory references only the workbook id, so minimal fixtures are sufficient.
// Titles are aligned with actual workbook names to ensure readability.
const GRAPH_WORKBOOK = {
  id: 1,
  title: 'ポテンシャル付き Union-Find',
} as unknown as WorkbooksList[number];
const DYNAMIC_PROGRAMMING_WORKBOOK_1 = {
  id: 2,
  title: '動的計画法（ナップサック問題）',
} as unknown as WorkbooksList[number];
const DYNAMIC_PROGRAMMING_WORKBOOK_2 = {
  id: 3,
  title: '動的計画法（区間 DP）',
} as unknown as WorkbooksList[number];
const PENDING_WORKBOOK = {
  id: 4,
  title: '数え上げ・確率（分類中）',
} as unknown as WorkbooksList[number];

function buildCategoryMap(entries: [number, SolutionCategory][]): Map<number, SolutionCategory> {
  return new Map(entries);
}

describe('groupBySolutionCategory', () => {
  test('groups workbooks by their SolutionCategory', () => {
    const workbooks = [
      GRAPH_WORKBOOK,
      DYNAMIC_PROGRAMMING_WORKBOOK_1,
      DYNAMIC_PROGRAMMING_WORKBOOK_2,
    ];
    const categoryMap = buildCategoryMap([
      [1, SolutionCategory.GRAPH],
      [2, SolutionCategory.DYNAMIC_PROGRAMMING],
      [3, SolutionCategory.DYNAMIC_PROGRAMMING],
    ]);

    const result = groupBySolutionCategory(workbooks, categoryMap);

    const graphGroup = result.find((group) => group.category === SolutionCategory.GRAPH);
    const dynamicProgrammingGroup = result.find(
      (group) => group.category === SolutionCategory.DYNAMIC_PROGRAMMING,
    );

    expect(graphGroup?.workbooks).toEqual([GRAPH_WORKBOOK]);
    expect(dynamicProgrammingGroup?.workbooks).toEqual([
      DYNAMIC_PROGRAMMING_WORKBOOK_1,
      DYNAMIC_PROGRAMMING_WORKBOOK_2,
    ]);
  });

  test('returns groups in SolutionCategory enum definition order', () => {
    const workbooks = [GRAPH_WORKBOOK, DYNAMIC_PROGRAMMING_WORKBOOK_1];
    const categoryMap = buildCategoryMap([
      [1, SolutionCategory.GRAPH],
      [2, SolutionCategory.DYNAMIC_PROGRAMMING],
    ]);

    const result = groupBySolutionCategory(workbooks, categoryMap);
    const categories = result.map((group) => group.category);

    const dynamicProgrammingIndex = Object.values(SolutionCategory).indexOf(
      SolutionCategory.DYNAMIC_PROGRAMMING,
    );
    const graphIndex = Object.values(SolutionCategory).indexOf(SolutionCategory.GRAPH);
    expect(categories.indexOf(SolutionCategory.DYNAMIC_PROGRAMMING)).toBeLessThan(
      categories.indexOf(SolutionCategory.GRAPH),
    );
    expect(dynamicProgrammingIndex).toBeLessThan(graphIndex);
  });

  test('excludes empty groups from the result', () => {
    const workbooks = [GRAPH_WORKBOOK];
    const categoryMap = buildCategoryMap([[1, SolutionCategory.GRAPH]]);

    const result = groupBySolutionCategory(workbooks, categoryMap);
    expect(result.every((group) => group.workbooks.length > 0)).toBe(true);
    expect(result.length).toBe(1);
  });

  test('includes PENDING group when PENDING workbooks are present', () => {
    const workbooks = [PENDING_WORKBOOK];
    const categoryMap = buildCategoryMap([[4, SolutionCategory.PENDING]]);

    const result = groupBySolutionCategory(workbooks, categoryMap);
    expect(result.find((group) => group.category === SolutionCategory.PENDING)).toBeDefined();
  });

  test('returns empty array when workbooks list is empty', () => {
    const result = groupBySolutionCategory([], new Map());
    expect(result).toEqual([]);
  });

  test('preserves workbook order within each group', () => {
    const workbooks = [DYNAMIC_PROGRAMMING_WORKBOOK_1, DYNAMIC_PROGRAMMING_WORKBOOK_2];
    const categoryMap = buildCategoryMap([
      [2, SolutionCategory.DYNAMIC_PROGRAMMING],
      [3, SolutionCategory.DYNAMIC_PROGRAMMING],
    ]);

    const result = groupBySolutionCategory(workbooks, categoryMap);
    const dynamicProgrammingGroup = result.find(
      (group) => group.category === SolutionCategory.DYNAMIC_PROGRAMMING,
    );

    expect(dynamicProgrammingGroup?.workbooks).toEqual([
      DYNAMIC_PROGRAMMING_WORKBOOK_1,
      DYNAMIC_PROGRAMMING_WORKBOOK_2,
    ]);
  });
});
