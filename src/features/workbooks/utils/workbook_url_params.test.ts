import { describe, test, expect } from 'vitest';
import { TaskGrade } from '$lib/types/task';
import { SolutionCategory } from '$features/workbooks/types/workbook_placement';
import { WorkBookTab } from '$features/workbooks/types/workbook';
import {
  parseWorkBookTab,
  parseWorkBookGrade,
  parseWorkBookCategory,
  buildWorkbooksUrl,
} from './workbook_url_params';

/** Test helper: creates URLSearchParams from a query string. */
function toParams(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe('parseWorkBookTab', () => {
  test('returns curriculum for tab=curriculum', () => {
    expect(parseWorkBookTab(toParams('tab=curriculum'))).toBe(WorkBookTab.CURRICULUM);
  });

  test('returns solution for tab=solution', () => {
    expect(parseWorkBookTab(toParams('tab=solution'))).toBe(WorkBookTab.SOLUTION);
  });

  test('returns created_by_user for tab=created_by_user', () => {
    expect(parseWorkBookTab(toParams('tab=created_by_user'))).toBe(WorkBookTab.CREATED_BY_USER);
  });

  test('returns curriculum (default) when tab is absent', () => {
    expect(parseWorkBookTab(toParams(''))).toBe(WorkBookTab.CURRICULUM);
  });

  test('returns curriculum (default) for invalid tab value', () => {
    expect(parseWorkBookTab(toParams('tab=invalid'))).toBe(WorkBookTab.CURRICULUM);
  });
});

describe('parseWorkBookGrade', () => {
  test('returns Q10 for grades=Q10', () => {
    expect(parseWorkBookGrade(toParams('grades=Q10'))).toBe(TaskGrade.Q10);
  });

  test('returns Q9 for grades=Q9', () => {
    expect(parseWorkBookGrade(toParams('grades=Q9'))).toBe(TaskGrade.Q9);
  });

  test('returns Q1 for grades=Q1', () => {
    expect(parseWorkBookGrade(toParams('grades=Q1'))).toBe(TaskGrade.Q1);
  });

  test('returns D1 for grades=D1', () => {
    expect(parseWorkBookGrade(toParams('grades=D1'))).toBe(TaskGrade.D1);
  });

  test('returns D6 for grades=D6', () => {
    expect(parseWorkBookGrade(toParams('grades=D6'))).toBe(TaskGrade.D6);
  });

  test('returns Q10 (default) when grades is absent', () => {
    expect(parseWorkBookGrade(toParams(''))).toBe(TaskGrade.Q10);
  });

  test('returns Q10 (default) for PENDING', () => {
    expect(parseWorkBookGrade(toParams('grades=PENDING'))).toBe(TaskGrade.Q10);
  });

  test('returns Q10 (default) for invalid value', () => {
    expect(parseWorkBookGrade(toParams('grades=Z99'))).toBe(TaskGrade.Q10);
  });
});

describe('parseWorkBookCategory', () => {
  test('returns SEARCH_SIMULATION for categories=SEARCH_SIMULATION', () => {
    expect(parseWorkBookCategory(toParams('categories=SEARCH_SIMULATION'))).toBe(
      SolutionCategory.SEARCH_SIMULATION,
    );
  });

  test('returns GRAPH for categories=GRAPH', () => {
    expect(parseWorkBookCategory(toParams('categories=GRAPH'))).toBe(SolutionCategory.GRAPH);
  });

  test('returns DYNAMIC_PROGRAMMING for categories=DYNAMIC_PROGRAMMING', () => {
    expect(parseWorkBookCategory(toParams('categories=DYNAMIC_PROGRAMMING'))).toBe(
      SolutionCategory.DYNAMIC_PROGRAMMING,
    );
  });

  test('returns DATA_STRUCTURE for categories=DATA_STRUCTURE', () => {
    expect(parseWorkBookCategory(toParams('categories=DATA_STRUCTURE'))).toBe(
      SolutionCategory.DATA_STRUCTURE,
    );
  });

  test('returns null (all categories) when categories is absent', () => {
    expect(parseWorkBookCategory(toParams(''))).toBeNull();
  });

  test('returns null (all categories) for PENDING', () => {
    expect(parseWorkBookCategory(toParams('categories=PENDING'))).toBeNull();
  });

  test('returns null (all categories) for invalid value', () => {
    expect(parseWorkBookCategory(toParams('categories=FLYING_FISH'))).toBeNull();
  });
});

describe('buildWorkbooksUrl', () => {
  test('curriculum tab with grade produces correct URL', () => {
    expect(buildWorkbooksUrl(WorkBookTab.CURRICULUM, TaskGrade.Q9)).toBe(
      '/workbooks?tab=curriculum&grades=Q9',
    );
  });

  test('solution tab with category produces correct URL', () => {
    expect(buildWorkbooksUrl(WorkBookTab.SOLUTION, undefined, SolutionCategory.GRAPH)).toBe(
      '/workbooks?tab=solution&categories=GRAPH',
    );
  });

  test('curriculum tab without grade produces URL with tab only', () => {
    expect(buildWorkbooksUrl(WorkBookTab.CURRICULUM)).toBe('/workbooks?tab=curriculum');
  });

  test('created_by_user tab produces URL with tab only', () => {
    expect(buildWorkbooksUrl(WorkBookTab.CREATED_BY_USER)).toBe('/workbooks?tab=created_by_user');
  });

  test('solution tab with null category produces URL without categories param', () => {
    expect(buildWorkbooksUrl(WorkBookTab.SOLUTION, undefined, null)).toBe(
      '/workbooks?tab=solution',
    );
  });
});
