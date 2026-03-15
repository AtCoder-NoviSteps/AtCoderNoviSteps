import { describe, test, expect } from 'vitest';

import { SolutionCategory } from '$features/workbooks/types/workbook_placement';
import { TaskGrade } from '$lib/types/task';

import { workbooks, solutionColumnsBefore } from '../_fixtures/kanban';
import {
  buildKanbanItems,
  buildUpdatedUrl,
  parseInitialCategories,
  parseInitialGrades,
  parseTab,
  reCalcPriorities,
} from './kanban';

describe('parseTab', () => {
  test('returns the param when it is a valid tab key', () => {
    expect(parseTab('solution')).toBe('solution');
    expect(parseTab('curriculum')).toBe('curriculum');
  });

  test('falls back to solution for null', () => {
    expect(parseTab(null)).toBe('solution');
  });

  test('falls back to solution for an unknown string', () => {
    expect(parseTab('unknown')).toBe('solution');
    expect(parseTab('')).toBe('solution');
  });
});

describe('parseInitialCategories', () => {
  test('returns parsed categories when param is present', () => {
    const params = new URLSearchParams(
      `categories=${SolutionCategory.GRAPH},${SolutionCategory.DYNAMIC_PROGRAMMING}`,
    );
    expect(parseInitialCategories(params)).toEqual([
      SolutionCategory.GRAPH,
      SolutionCategory.DYNAMIC_PROGRAMMING,
    ]);
  });

  test('returns default categories when param is absent', () => {
    const params = new URLSearchParams();
    expect(parseInitialCategories(params)).toEqual([
      SolutionCategory.PENDING,
      SolutionCategory.GRAPH,
    ]);
  });

  test('drops invalid category values', () => {
    const params = new URLSearchParams(`categories=${SolutionCategory.GRAPH},INVALID`);
    expect(parseInitialCategories(params)).toEqual([SolutionCategory.GRAPH]);
  });

  test('returns empty array when all values are invalid', () => {
    const params = new URLSearchParams('categories=INVALID');
    expect(parseInitialCategories(params)).toEqual([]);
  });

  test('ignores empty strings from trailing commas', () => {
    const params = new URLSearchParams(`categories=${SolutionCategory.GRAPH},`);
    expect(parseInitialCategories(params)).toEqual([SolutionCategory.GRAPH]);
  });
});

describe('parseInitialGrades', () => {
  test('returns parsed grades when param is present', () => {
    const params = new URLSearchParams(`grades=${TaskGrade.Q10},${TaskGrade.Q9}`);
    expect(parseInitialGrades(params)).toEqual([TaskGrade.Q10, TaskGrade.Q9]);
  });

  test('returns default grades when param is absent', () => {
    const params = new URLSearchParams();
    expect(parseInitialGrades(params)).toEqual([TaskGrade.Q10, TaskGrade.Q9]);
  });

  test('drops PENDING even when explicitly included', () => {
    const params = new URLSearchParams(`grades=${TaskGrade.PENDING},${TaskGrade.Q10}`);
    expect(parseInitialGrades(params)).toEqual([TaskGrade.Q10]);
  });

  test('drops invalid grade values', () => {
    const params = new URLSearchParams(`grades=${TaskGrade.Q10},INVALID`);
    expect(parseInitialGrades(params)).toEqual([TaskGrade.Q10]);
  });

  test('returns empty array when all values are invalid or PENDING', () => {
    const params = new URLSearchParams(`grades=${TaskGrade.PENDING},INVALID`);
    expect(parseInitialGrades(params)).toEqual([]);
  });
});

describe('buildUpdatedUrl', () => {
  const baseUrl = new URL('https://example.com/workbooks/order');

  test('solution tab: sets tab and categories, deletes grades', () => {
    const result = buildUpdatedUrl(
      baseUrl,
      'solution',
      [SolutionCategory.GRAPH, SolutionCategory.PENDING],
      [],
    );
    expect(result.searchParams.get('tab')).toBe('solution');
    expect(result.searchParams.get('categories')).toBe(
      `${SolutionCategory.GRAPH},${SolutionCategory.PENDING}`,
    );
    expect(result.searchParams.has('grades')).toBe(false);
  });

  test('curriculum tab: sets tab and grades, deletes categories', () => {
    const result = buildUpdatedUrl(baseUrl, 'curriculum', [], [TaskGrade.Q10, TaskGrade.Q9]);
    expect(result.searchParams.get('tab')).toBe('curriculum');
    expect(result.searchParams.get('grades')).toBe(`${TaskGrade.Q10},${TaskGrade.Q9}`);
    expect(result.searchParams.has('categories')).toBe(false);
  });

  test('solution tab with empty categories produces empty string value', () => {
    const result = buildUpdatedUrl(baseUrl, 'solution', [], []);
    expect(result.searchParams.get('categories')).toBe('');
  });

  test('overwrites existing params without duplicating', () => {
    const url = new URL(
      `https://example.com/workbooks/order?tab=curriculum&grades=${TaskGrade.Q10}&categories=${SolutionCategory.GRAPH}`,
    );
    const result = buildUpdatedUrl(url, 'solution', [SolutionCategory.PENDING], []);
    expect(result.searchParams.getAll('tab')).toHaveLength(1);
    expect(result.searchParams.get('tab')).toBe('solution');
    expect(result.searchParams.has('grades')).toBe(false);
  });

  test('does not mutate the original URL', () => {
    const url = new URL('https://example.com/workbooks/order?tab=curriculum');
    buildUpdatedUrl(url, 'solution', [SolutionCategory.GRAPH], []);
    expect(url.searchParams.get('tab')).toBe('curriculum');
  });
});

describe('buildKanbanItems', () => {
  test('initializes all enum keys as empty arrays', () => {
    const result = buildKanbanItems([], ['PENDING', 'GRAPH', 'DATA_STRUCTURE'], () => null);
    expect(result).toEqual({ PENDING: [], GRAPH: [], DATA_STRUCTURE: [] });
  });

  test('groups workbooks by solutionCategory', () => {
    const result = buildKanbanItems(
      workbooks,
      [SolutionCategory.PENDING, SolutionCategory.GRAPH, SolutionCategory.DYNAMIC_PROGRAMMING],
      (workbook) => workbook.placement?.solutionCategory ?? null,
    );

    expect(result[SolutionCategory.PENDING]).toHaveLength(1);
    expect(result[SolutionCategory.PENDING][0]).toMatchObject({
      id: 103,
      workBookId: 3,
      title: 'Pending Book',
    });
    expect(result[SolutionCategory.GRAPH]).toHaveLength(1);
    expect(result[SolutionCategory.GRAPH][0]).toMatchObject({
      id: 101,
      workBookId: 1,
      title: 'Graph Basics',
    });
    expect(result[SolutionCategory.DYNAMIC_PROGRAMMING]).toHaveLength(1);
    expect(result[SolutionCategory.DYNAMIC_PROGRAMMING][0]).toMatchObject({
      id: 102,
      workBookId: 2,
    });
  });

  test('excludes workbooks with null column key (no placement or wrong type)', () => {
    const result = buildKanbanItems(
      workbooks,
      [TaskGrade.Q10, TaskGrade.Q9],
      (workbook) => workbook.placement?.taskGrade ?? null,
    );

    expect(result[TaskGrade.Q10]).toHaveLength(1);
    expect(result[TaskGrade.Q10][0]).toMatchObject({
      id: 201,
      workBookId: 4,
      title: 'Curriculum Q10',
    });
    expect(result[TaskGrade.Q9]).toHaveLength(0);
  });

  test('sorts workbooks by placement priority within each column', () => {
    // Two GRAPH workbooks inserted in reverse priority order: priority 2 first, priority 1 second.
    const reversed = [
      { ...workbooks[0], placement: { ...workbooks[0].placement!, priority: 2 } },
      {
        ...workbooks[0],
        id: 99,
        placement: { ...workbooks[0].placement!, id: 999, workBookId: 99, priority: 1 },
      },
    ];
    const result = buildKanbanItems(
      reversed,
      [SolutionCategory.GRAPH],
      (workbook) => workbook.placement?.solutionCategory ?? null,
    );
    expect(result[SolutionCategory.GRAPH][0].id).toBe(999); // priority 1 first
    expect(result[SolutionCategory.GRAPH][1].id).toBe(101); // priority 2 second
  });

  test('card includes isPublished field', () => {
    // workbooks[0]: Graph Basics, isPublished: true
    const result = buildKanbanItems(
      [workbooks[0]],
      [SolutionCategory.GRAPH],
      (workbook) => workbook.placement?.solutionCategory ?? null,
    );
    expect(result[SolutionCategory.GRAPH][0].isPublished).toBe(true);
  });

  test('does not include workbooks where placement is null', () => {
    // workbooks[4]: No placement, placement: null
    const result = buildKanbanItems(
      [workbooks[4]],
      [SolutionCategory.GRAPH],
      (workbook) => workbook.placement?.solutionCategory ?? null,
    );
    expect(result[SolutionCategory.GRAPH]).toHaveLength(0);
  });
});

describe('reCalcPriorities', () => {
  const before = solutionColumnsBefore;

  test('returns empty array when nothing changed', () => {
    const after = structuredClone(before);
    expect(reCalcPriorities(before, after, 'solutionCategory')).toEqual([]);
  });

  test('returns updates for reordered cards within a column', () => {
    const after = {
      ...before,
      [SolutionCategory.GRAPH]: [
        before[SolutionCategory.GRAPH][1],
        before[SolutionCategory.GRAPH][0],
      ], // swapped
    };

    const updates = reCalcPriorities(before, after, 'solutionCategory');
    expect(updates).toHaveLength(2);
    expect(updates[0]).toMatchObject({
      id: 102,
      priority: 1,
      solutionCategory: SolutionCategory.GRAPH,
      taskGrade: null,
    });
    expect(updates[1]).toMatchObject({
      id: 101,
      priority: 2,
      solutionCategory: SolutionCategory.GRAPH,
      taskGrade: null,
    });
  });

  test('returns updates only for changed columns', () => {
    const after = {
      [SolutionCategory.GRAPH]: [
        before[SolutionCategory.GRAPH][1],
        before[SolutionCategory.GRAPH][0],
      ], // changed
      [SolutionCategory.PENDING]: before[SolutionCategory.PENDING], // unchanged
    };

    const updates = reCalcPriorities(before, after, 'solutionCategory');
    const updatedIds = updates.map((update) => update.id);
    expect(updatedIds).not.toContain(103);
    expect(updatedIds).toContain(101);
    expect(updatedIds).toContain(102);
  });

  test('sets taskGrade instead of solutionCategory when columnKey is taskGrade', () => {
    const gradeBefore = {
      [TaskGrade.Q10]: [{ id: 201, workBookId: 4, title: 'Q10 Book', isPublished: true }],
      [TaskGrade.Q9]: [{ id: 202, workBookId: 5, title: 'Q9 Book', isPublished: true }],
    };
    const gradeAfter = {
      [TaskGrade.Q10]: [{ id: 202, workBookId: 5, title: 'Q9 Book', isPublished: true }], // moved from Q9
      [TaskGrade.Q9]: [{ id: 201, workBookId: 4, title: 'Q10 Book', isPublished: true }],
    };

    const updates = reCalcPriorities(gradeBefore, gradeAfter, 'taskGrade');
    expect(updates.every((update) => update.solutionCategory === null)).toBe(true);
    expect(updates.find((update) => update.id === 202)).toMatchObject({
      taskGrade: TaskGrade.Q10,
      solutionCategory: null,
    });
  });

  test('returns updates for columns missing from before (new column)', () => {
    const updates = reCalcPriorities(
      {},
      {
        [SolutionCategory.GRAPH]: [{ id: 101, workBookId: 1, title: 'Test', isPublished: true }],
      },
      'solutionCategory',
    );
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      id: 101,
      priority: 1,
      solutionCategory: SolutionCategory.GRAPH,
    });
  });

  test('returns updates for both columns when a card is moved across columns', () => {
    const crossBefore = {
      [SolutionCategory.GRAPH]: [
        { id: 101, workBookId: 1, title: 'Graph Basics', isPublished: true },
      ],
      [SolutionCategory.PENDING]: [],
    };
    const crossAfter = {
      [SolutionCategory.GRAPH]: [],
      [SolutionCategory.PENDING]: [
        { id: 101, workBookId: 1, title: 'Graph Basics', isPublished: true },
      ],
    };

    const updates = reCalcPriorities(crossBefore, crossAfter, 'solutionCategory');
    // GRAPH is now empty (changed), PENDING gained a card (changed) → both produce updates
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      id: 101,
      priority: 1,
      solutionCategory: SolutionCategory.PENDING,
    });
  });

  test('returns empty array when after is empty and before is empty', () => {
    expect(reCalcPriorities({}, {}, 'solutionCategory')).toEqual([]);
  });
});
