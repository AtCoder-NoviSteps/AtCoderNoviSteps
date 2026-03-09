import { describe, test, expect } from 'vitest';

import {
  buildKanbanItems,
  calcPriorityUpdates,
} from '../../../../../../routes/(admin)/workbooks/order/_utils/kanban';
import type { WorkbooksWithPlacement } from '$features/workbooks/types/workbook_placement';

// Minimal fixture: workbooks with placements
const workbooks: WorkbooksWithPlacement = [
  {
    id: 1,
    title: 'Graph Basics',
    isPublished: true,
    workBookType: 'SOLUTION',
    placement: { id: 101, workBookId: 1, solutionCategory: 'GRAPH', taskGrade: null, priority: 1 },
  },
  {
    id: 2,
    title: 'DP Intro',
    isPublished: false,
    workBookType: 'SOLUTION',
    placement: {
      id: 102,
      workBookId: 2,
      solutionCategory: 'DYNAMIC_PROGRAMMING',
      taskGrade: null,
      priority: 2,
    },
  },
  {
    id: 3,
    title: 'Pending Book',
    isPublished: true,
    workBookType: 'SOLUTION',
    placement: {
      id: 103,
      workBookId: 3,
      solutionCategory: 'PENDING',
      taskGrade: null,
      priority: 1,
    },
  },
  {
    id: 4,
    title: 'Curriculum Q10',
    isPublished: true,
    workBookType: 'CURRICULUM',
    placement: { id: 201, workBookId: 4, solutionCategory: null, taskGrade: 'Q10', priority: 1 },
  },
  {
    id: 5,
    title: 'No placement',
    isPublished: true,
    workBookType: 'SOLUTION',
    placement: null,
  },
];

describe('buildKanbanItems', () => {
  test('initializes all enum keys as empty arrays', () => {
    const result = buildKanbanItems([], ['PENDING', 'GRAPH', 'DATA_STRUCTURE'], () => null);
    expect(result).toEqual({ PENDING: [], GRAPH: [], DATA_STRUCTURE: [] });
  });

  test('groups workbooks by solutionCategory', () => {
    const result = buildKanbanItems(
      workbooks,
      ['PENDING', 'GRAPH', 'DYNAMIC_PROGRAMMING'],
      (workbook) => workbook.placement?.solutionCategory ?? null,
    );

    expect(result['PENDING']).toHaveLength(1);
    expect(result['PENDING'][0]).toMatchObject({ id: 103, workBookId: 3, title: 'Pending Book' });
    expect(result['GRAPH']).toHaveLength(1);
    expect(result['GRAPH'][0]).toMatchObject({ id: 101, workBookId: 1, title: 'Graph Basics' });
    expect(result['DYNAMIC_PROGRAMMING']).toHaveLength(1);
    expect(result['DYNAMIC_PROGRAMMING'][0]).toMatchObject({ id: 102, workBookId: 2 });
  });

  test('excludes workbooks with null column key (no placement or wrong type)', () => {
    const result = buildKanbanItems(
      workbooks,
      ['Q10', 'Q9'],
      (workbook) => workbook.placement?.taskGrade ?? null,
    );

    expect(result['Q10']).toHaveLength(1);
    expect(result['Q10'][0]).toMatchObject({ id: 201, workBookId: 4, title: 'Curriculum Q10' });
    expect(result['Q9']).toHaveLength(0);
  });

  test('sorts workbooks by placement priority within each column', () => {
    const multi: WorkbooksWithPlacement = [
      {
        id: 10,
        title: 'Second',
        isPublished: true,
        workBookType: 'SOLUTION',
        placement: {
          id: 10,
          workBookId: 10,
          solutionCategory: 'GRAPH',
          taskGrade: null,
          priority: 2,
        },
      },
      {
        id: 11,
        title: 'First',
        isPublished: true,
        workBookType: 'SOLUTION',
        placement: {
          id: 11,
          workBookId: 11,
          solutionCategory: 'GRAPH',
          taskGrade: null,
          priority: 1,
        },
      },
    ];

    const result = buildKanbanItems(
      multi,
      ['GRAPH'],
      (wb) => wb.placement?.solutionCategory ?? null,
    );
    expect(result['GRAPH'][0].title).toBe('First');
    expect(result['GRAPH'][1].title).toBe('Second');
  });

  test('card includes isPublished field', () => {
    const graphOnly: WorkbooksWithPlacement = [
      {
        id: 1,
        title: 'Graph Basics',
        isPublished: true,
        workBookType: 'SOLUTION',
        placement: {
          id: 101,
          workBookId: 1,
          solutionCategory: 'GRAPH',
          taskGrade: null,
          priority: 1,
        },
      },
    ];
    const result = buildKanbanItems(
      graphOnly,
      ['GRAPH'],
      (workbook) => workbook.placement?.solutionCategory ?? null,
    );
    expect(result['GRAPH'][0].isPublished).toBe(true);
  });
});

describe('calcPriorityUpdates', () => {
  const before = {
    GRAPH: [
      { id: 101, workBookId: 1, title: 'Graph Basics', isPublished: true },
      { id: 102, workBookId: 2, title: 'Graph Advanced', isPublished: false },
    ],
    PENDING: [{ id: 103, workBookId: 3, title: 'Pending Book', isPublished: true }],
  };

  test('returns empty array when nothing changed', () => {
    const after = structuredClone(before);
    expect(calcPriorityUpdates(before, after, 'solutionCategory')).toEqual([]);
  });

  test('returns updates for reordered cards within a column', () => {
    const after = {
      ...before,
      GRAPH: [before.GRAPH[1], before.GRAPH[0]], // swapped
    };

    const updates = calcPriorityUpdates(before, after, 'solutionCategory');
    expect(updates).toHaveLength(2);
    expect(updates[0]).toMatchObject({
      id: 102,
      priority: 1,
      solutionCategory: 'GRAPH',
      taskGrade: null,
    });
    expect(updates[1]).toMatchObject({
      id: 101,
      priority: 2,
      solutionCategory: 'GRAPH',
      taskGrade: null,
    });
  });

  test('returns updates only for changed columns', () => {
    const after = {
      GRAPH: [before.GRAPH[1], before.GRAPH[0]], // changed
      PENDING: before.PENDING, // unchanged
    };

    const updates = calcPriorityUpdates(before, after, 'solutionCategory');
    const updatedIds = updates.map((update) => update.id);
    expect(updatedIds).not.toContain(103);
    expect(updatedIds).toContain(101);
    expect(updatedIds).toContain(102);
  });

  test('sets taskGrade instead of solutionCategory when columnKey is taskGrade', () => {
    const gradeBefore = {
      Q10: [{ id: 201, workBookId: 4, title: 'Q10 Book', isPublished: true }],
      Q9: [{ id: 202, workBookId: 5, title: 'Q9 Book', isPublished: true }],
    };
    const gradeAfter = {
      Q10: [{ id: 202, workBookId: 5, title: 'Q9 Book', isPublished: true }], // moved from Q9
      Q9: [{ id: 201, workBookId: 4, title: 'Q10 Book', isPublished: true }],
    };

    const updates = calcPriorityUpdates(gradeBefore, gradeAfter, 'taskGrade');
    expect(updates.every((update) => update.solutionCategory === null)).toBe(true);
    expect(updates.find((update) => update.id === 202)).toMatchObject({
      taskGrade: 'Q10',
      solutionCategory: null,
    });
  });

  test('returns updates for columns missing from before (new column)', () => {
    const updates = calcPriorityUpdates(
      {},
      { GRAPH: [{ id: 101, workBookId: 1, title: 'Test', isPublished: true }] },
      'solutionCategory',
    );
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ id: 101, priority: 1, solutionCategory: 'GRAPH' });
  });
});
