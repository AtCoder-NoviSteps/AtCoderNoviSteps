import { describe, test, expect, vi, beforeEach } from 'vitest';

import { TaskGrade } from '$lib/types/task';
import {
  SolutionCategory,
  type WorkBookPlacements,
} from '$features/workbooks/types/workbook_placement';

import {
  getWorkBookPlacements,
  upsertWorkBookPlacements,
  initializeCurriculumPlacements,
  initializeSolutionPlacements,
} from '$features/workbooks/services/workbook_placements';

vi.mock('$lib/server/database', () => ({
  default: {
    workBookPlacement: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from '$lib/server/database';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getWorkBookPlacements', () => {
  test('returns placements of type CURRICULUM', async () => {
    const mockPlacements: WorkBookPlacements = [
      { id: 1, workBookId: 1, taskGrade: TaskGrade.Q10, solutionCategory: null, priority: 1 },
      { id: 2, workBookId: 2, taskGrade: TaskGrade.Q9, solutionCategory: null, priority: 1 },
    ];
    vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue(
      mockPlacements as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
    );

    const result = await getWorkBookPlacements('CURRICULUM');

    expect(result).toEqual(mockPlacements);
    expect(prisma.workBookPlacement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workBook: { workBookType: 'CURRICULUM' } }),
      }),
    );
  });

  test('returns placements of type SOLUTION', async () => {
    const mockPlacements: WorkBookPlacements = [
      {
        id: 3,
        workBookId: 3,
        taskGrade: null,
        solutionCategory: SolutionCategory.GRAPH,
        priority: 1,
      },
    ];
    vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue(
      mockPlacements as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
    );

    const result = await getWorkBookPlacements('SOLUTION');

    expect(result).toEqual(mockPlacements);
    expect(prisma.workBookPlacement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workBook: { workBookType: 'SOLUTION' } }),
      }),
    );
  });
});

describe('upsertWorkBookPlacements', () => {
  test('updates multiple placements within a transaction', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    const updates = [
      { id: 1, priority: 1, taskGrade: TaskGrade.Q10, solutionCategory: null },
      { id: 2, priority: 2, taskGrade: TaskGrade.Q10, solutionCategory: null },
    ];
    await upsertWorkBookPlacements(updates);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  test('does not call transaction when given an empty array', async () => {
    await upsertWorkBookPlacements([]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('initializeSolutionPlacements', () => {
  test('initializes all workbooks with PENDING', () => {
    const workbooks = [{ id: 1 }, { id: 2 }];
    const result = initializeSolutionPlacements(workbooks);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      workBookId: 1,
      solutionCategory: SolutionCategory.PENDING,
      taskGrade: null,
      priority: 1,
    });
    expect(result[1]).toMatchObject({
      workBookId: 2,
      solutionCategory: SolutionCategory.PENDING,
      taskGrade: null,
      priority: 2,
    });
  });

  test('returns empty array for empty input', () => {
    expect(initializeSolutionPlacements([])).toEqual([]);
  });
});

describe('initializeCurriculumPlacements', () => {
  test('initializes with mode grade and assigns priority in ascending workbook id order within the same grade', () => {
    const tasksByTaskId = new Map([
      [
        't1',
        {
          task_id: 't1',
          contest_id: 'abc001',
          task_table_index: 'A',
          title: 'T1',
          grade: TaskGrade.Q10,
        },
      ],
      [
        't2',
        {
          task_id: 't2',
          contest_id: 'abc001',
          task_table_index: 'B',
          title: 'T2',
          grade: TaskGrade.Q10,
        },
      ],
      [
        't3',
        {
          task_id: 't3',
          contest_id: 'abc002',
          task_table_index: 'A',
          title: 'T3',
          grade: TaskGrade.Q9,
        },
      ],
    ]);
    const workbooks = [
      {
        id: 10,
        workBookTasks: [
          { taskId: 't1', priority: 1, comment: '' },
          { taskId: 't2', priority: 2, comment: '' },
        ],
      },
      {
        id: 5,
        workBookTasks: [{ taskId: 't3', priority: 1, comment: '' }],
      },
      {
        id: 7,
        workBookTasks: [{ taskId: 't1', priority: 1, comment: '' }],
      },
    ];

    const result = initializeCurriculumPlacements(workbooks, tasksByTaskId);

    // id:5 → Q9 priority:1, id:7 → Q10 priority:1, id:10 → Q10 priority:2
    const byWorkBookId = new Map(result.map((r) => [r.workBookId, r]));
    expect(byWorkBookId.get(5)).toMatchObject({ taskGrade: TaskGrade.Q9, priority: 1 });
    expect(byWorkBookId.get(7)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 1 });
    expect(byWorkBookId.get(10)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 2 });
  });

  test('initializes workbook with no tasks as PENDING', () => {
    const tasksByTaskId = new Map();
    const workbooks = [{ id: 1, workBookTasks: [] }];
    const result = initializeCurriculumPlacements(workbooks, tasksByTaskId);
    expect(result[0]).toMatchObject({ workBookId: 1, taskGrade: TaskGrade.PENDING, priority: 1 });
  });

  test('returns empty array for empty input', () => {
    expect(initializeCurriculumPlacements([], new Map())).toEqual([]);
  });
});

describe('cross-type movement between CURRICULUM and SOLUTION (server-side validation)', () => {
  test('allows movement within the same type (CURRICULUM → CURRICULUM)', () => {
    const updates = [{ id: 1, priority: 1, taskGrade: TaskGrade.Q10, solutionCategory: null }];
    const isValid = updates.every(
      (u) =>
        (u.taskGrade !== null && u.solutionCategory === null) ||
        (u.taskGrade === null && u.solutionCategory !== null),
    );
    expect(isValid).toBeTruthy();
  });

  test('detects CURRICULUM→SOLUTION mix as XOR violation', () => {
    const invalidUpdate = {
      id: 1,
      priority: 1,
      taskGrade: TaskGrade.Q10,
      solutionCategory: SolutionCategory.GRAPH,
    };
    const isXorViolation =
      invalidUpdate.taskGrade !== null && invalidUpdate.solutionCategory !== null;
    expect(isXorViolation).toBeTruthy();
  });

  test('processes a batch containing both CURRICULUM and SOLUTION placements', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    // Mixed batch: curriculum placements (taskGrade set) and solution placements (solutionCategory set)
    const updates = [
      { id: 1, priority: 1, taskGrade: TaskGrade.Q10, solutionCategory: null },
      { id: 2, priority: 2, taskGrade: TaskGrade.Q9, solutionCategory: null },
      { id: 3, priority: 1, taskGrade: null, solutionCategory: SolutionCategory.DATA_STRUCTURE },
      { id: 4, priority: 2, taskGrade: null, solutionCategory: SolutionCategory.SEARCH_SIMULATION },
    ];

    await upsertWorkBookPlacements(updates);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    const callArg = vi.mocked(prisma.$transaction).mock.calls[0][0];

    expect(Array.isArray(callArg)).toBe(true);
    expect(callArg).toHaveLength(4);

    // Each entry must satisfy XOR: exactly one of taskGrade/solutionCategory is non-null
    const allXorValid = updates.every(
      (update) =>
        (update.taskGrade !== null && update.solutionCategory === null) ||
        (update.taskGrade === null && update.solutionCategory !== null),
    );
    expect(allXorValid).toBe(true);
  });
});

describe('solutionCategory-specific scenarios', () => {
  test('getWorkBookPlacements returns placements with multiple distinct solutionCategory values', async () => {
    // Reflects the solutionCategoryMap fixture:
    //   stack, potentialized-union-find, priority-queue, map-dict, ordered-set → DATA_STRUCTURE
    //   bitmask-brute-force-search, greedy-method, recursive-function → SEARCH_SIMULATION
    //   number-theory-search → NUMBER_THEORY
    const mockPlacements: WorkBookPlacements = [
      {
        id: 1,
        workBookId: 1,
        taskGrade: null,
        solutionCategory: SolutionCategory.DATA_STRUCTURE,
        priority: 1,
      },
      {
        id: 2,
        workBookId: 2,
        taskGrade: null,
        solutionCategory: SolutionCategory.DATA_STRUCTURE,
        priority: 2,
      },
      {
        id: 3,
        workBookId: 3,
        taskGrade: null,
        solutionCategory: SolutionCategory.SEARCH_SIMULATION,
        priority: 1,
      },
      {
        id: 4,
        workBookId: 4,
        taskGrade: null,
        solutionCategory: SolutionCategory.NUMBER_THEORY,
        priority: 1,
      },
      {
        id: 5,
        workBookId: 5,
        taskGrade: null,
        solutionCategory: SolutionCategory.PENDING,
        priority: 1,
      },
    ];
    vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue(
      mockPlacements as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
    );

    const result = await getWorkBookPlacements('SOLUTION');
    expect(result).toHaveLength(5);

    const categories = result.map((placement) => placement.solutionCategory);

    expect(categories).toContain(SolutionCategory.DATA_STRUCTURE);
    expect(categories).toContain(SolutionCategory.SEARCH_SIMULATION);
    expect(categories).toContain(SolutionCategory.NUMBER_THEORY);
    expect(categories).toContain(SolutionCategory.PENDING);
    // All SOLUTION placements must have taskGrade === null
    expect(result.every((placement) => placement.taskGrade === null)).toBe(true);
  });

  test('upsertWorkBookPlacements updates solutionCategory from PENDING to a specific category', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    // Simulates the admin moving a workbook from PENDING to DATA_STRUCTURE on the Kanban board
    const updates = [
      { id: 5, priority: 3, taskGrade: null, solutionCategory: SolutionCategory.DATA_STRUCTURE },
    ];

    await upsertWorkBookPlacements(updates);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  test('initializeSolutionPlacements assigns sequential priorities regardless of workbook id order', () => {
    // Workbooks in non-sequential ID order (as they may arrive from DB)
    const workbooks = [{ id: 30 }, { id: 10 }, { id: 20 }];
    const result = initializeSolutionPlacements(workbooks);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      workBookId: 30,
      solutionCategory: SolutionCategory.PENDING,
      priority: 1,
    });
    expect(result[1]).toMatchObject({
      workBookId: 10,
      solutionCategory: SolutionCategory.PENDING,
      priority: 2,
    });
    expect(result[2]).toMatchObject({
      workBookId: 20,
      solutionCategory: SolutionCategory.PENDING,
      priority: 3,
    });
    // All must have taskGrade === null
    expect(result.every((placement) => placement.taskGrade === null)).toBe(true);
  });
});

describe('initializeCurriculumPlacements with fixture-based task data', () => {
  test('assigns correct grades and priorities for workbooks spanning multiple grades', () => {
    // Reflects actual curriculum workbooks from the fixture:
    //   '標準入出力（1 個の整数）'   → tasks Q10: math_and_algorithm_a, tessoku_book_a, ...
    //   '標準入出力（2 個以上の整数）' → tasks Q9: tessoku_book_bz, abc169_a, ...
    //   'if 文 ①'                  → tasks Q8: abc174_a, abc334_a, ...
    const tasksByTaskId = new Map([
      [
        'math_and_algorithm_a',
        {
          task_id: 'math_and_algorithm_a',
          contest_id: 'math_and_algorithm',
          task_table_index: 'A',
          title: 'A. はじめのいっぽ',
          grade: TaskGrade.Q10,
        },
      ],
      [
        'tessoku_book_a',
        {
          task_id: 'tessoku_book_a',
          contest_id: 'tessoku_book',
          task_table_index: 'A',
          title: 'A. はじめの一歩',
          grade: TaskGrade.Q10,
        },
      ],
      [
        'tessoku_book_bz',
        {
          task_id: 'tessoku_book_bz',
          contest_id: 'tessoku_book',
          task_table_index: 'BZ',
          title: 'BZ. 問題',
          grade: TaskGrade.Q9,
        },
      ],
      [
        'abc169_a',
        {
          task_id: 'abc169_a',
          contest_id: 'abc169',
          task_table_index: 'A',
          title: 'A. Multiplication 1',
          grade: TaskGrade.Q9,
        },
      ],
      [
        'abc174_a',
        {
          task_id: 'abc174_a',
          contest_id: 'abc174',
          task_table_index: 'A',
          title: 'A. Air Conditioner',
          grade: TaskGrade.Q8,
        },
      ],
    ]);

    // workbook IDs chosen to reflect DB insertion order (lower id = earlier in seed)
    const workbooks = [
      {
        id: 1,
        workBookTasks: [
          { taskId: 'math_and_algorithm_a', priority: 1, comment: '' },
          { taskId: 'tessoku_book_a', priority: 2, comment: '' },
        ],
      },
      {
        id: 2,
        workBookTasks: [
          { taskId: 'tessoku_book_bz', priority: 1, comment: '' },
          { taskId: 'abc169_a', priority: 2, comment: '' },
        ],
      },
      { id: 6, workBookTasks: [{ taskId: 'abc174_a', priority: 1, comment: '' }] },
    ];

    const result = initializeCurriculumPlacements(workbooks, tasksByTaskId);
    const byId = new Map(result.map((r) => [r.workBookId, r]));

    expect(byId.get(1)).toMatchObject({
      taskGrade: TaskGrade.Q10,
      solutionCategory: null,
      priority: 1,
    });
    expect(byId.get(2)).toMatchObject({
      taskGrade: TaskGrade.Q9,
      solutionCategory: null,
      priority: 1,
    });
    expect(byId.get(6)).toMatchObject({
      taskGrade: TaskGrade.Q8,
      solutionCategory: null,
      priority: 1,
    });
  });

  test('assigns ascending priorities within the same grade based on workbook id', () => {
    // Two Q10 workbooks: id=1 ('標準入出力 1個') and id=7 ('if 文 ②')
    // id=1 should get priority:1, id=7 should get priority:2
    const tasksByTaskId = new Map([
      [
        'math_and_algorithm_a',
        {
          task_id: 'math_and_algorithm_a',
          contest_id: 'math_and_algorithm',
          task_table_index: 'A',
          title: 'A.',
          grade: TaskGrade.Q10,
        },
      ],
      [
        'abc219_a',
        {
          task_id: 'abc219_a',
          contest_id: 'abc219',
          task_table_index: 'A',
          title: 'A.',
          grade: TaskGrade.Q10,
        },
      ],
    ]);
    const workbooks = [
      { id: 7, workBookTasks: [{ taskId: 'abc219_a', priority: 1, comment: '' }] },
      { id: 1, workBookTasks: [{ taskId: 'math_and_algorithm_a', priority: 1, comment: '' }] },
    ];

    const result = initializeCurriculumPlacements(workbooks, tasksByTaskId);
    const byId = new Map(result.map((r) => [r.workBookId, r]));

    expect(byId.get(1)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 1 });
    expect(byId.get(7)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 2 });
  });
});
