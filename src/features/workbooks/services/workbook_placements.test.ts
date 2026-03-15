import { describe, test, expect, vi, beforeEach } from 'vitest';

import { TaskGrade } from '$lib/types/task';
import { WorkBookType } from '$features/workbooks/types/workbook';
import {
  SolutionCategory,
  type WorkBookPlacements,
  type UnplacedCurriculumRows,
} from '$features/workbooks/types/workbook_placement';

import {
  getWorkbooksWithPlacements,
  getPlacementsByWorkBookType,
  updateWorkBookPlacements,
  createInitialPlacements,
  buildTaskMapFromCurriculumRows,
  buildCurriculumWorkbooksForInit,
  initializeCurriculumPlacements,
  groupWorkbooksByGrade,
  buildPlacementsFromGroups,
  initializeSolutionPlacements,
  validateAndUpdatePlacements,
  createWorkBookPlacements,
} from '$features/workbooks/services/workbook_placements';

import {
  curriculumPlacements,
  solutionPlacements,
  workbooksWithPlacements,
  curriculumPlacementRow,
  solutionPlacementRow,
  tasksMapByIds,
  curriculumWorkbooksForInit,
  unplacedCurriculumRows,
  unplacedSolutionWorkbooks,
} from '$features/workbooks/fixtures/workbook_placements';

vi.mock('$lib/server/database', () => ({
  default: {
    workBook: {
      findMany: vi.fn(),
    },
    workBookPlacement: {
      findMany: vi.fn(),
      update: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from '$lib/server/database';

beforeEach(() => {
  vi.clearAllMocks();
});

function mockFindMany(placements: WorkBookPlacements) {
  vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue(
    placements as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
  );
}

function mockPlacementFindManyOnce(placements: WorkBookPlacements) {
  vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValueOnce(
    placements as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
  );
}

function mockWorkBookFindManyOnce(result: { id: number }[]) {
  vi.mocked(prisma.workBook.findMany).mockResolvedValueOnce(
    result as unknown as Awaited<ReturnType<typeof prisma.workBook.findMany>>,
  );
}

describe('getWorkbooksWithPlacements', () => {
  test('returns workbooks of type CURRICULUM and SOLUTION with their placements', async () => {
    mockWorkBookFindManyOnce(workbooksWithPlacements);

    const result = await getWorkbooksWithPlacements();

    expect(result).toEqual(workbooksWithPlacements);
    expect(prisma.workBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workBookType: { in: [WorkBookType.CURRICULUM, WorkBookType.SOLUTION] },
        }),
      }),
    );
  });
});

describe('getPlacementsByWorkBookType', () => {
  test('returns CURRICULUM placements ordered by priority', async () => {
    mockFindMany(curriculumPlacements);

    const result = await getPlacementsByWorkBookType(WorkBookType.CURRICULUM);

    // Verifies the function returns the DB result without transformation
    expect(result).toEqual(curriculumPlacements);
    expect(prisma.workBookPlacement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workBook: { workBookType: WorkBookType.CURRICULUM } }),
        orderBy: { priority: 'asc' },
      }),
    );
  });

  test('returns SOLUTION placements ordered by priority', async () => {
    mockFindMany(solutionPlacements);

    const result = await getPlacementsByWorkBookType(WorkBookType.SOLUTION);

    expect(result).toEqual(solutionPlacements);
    expect(prisma.workBookPlacement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workBook: { workBookType: WorkBookType.SOLUTION } }),
        orderBy: { priority: 'asc' },
      }),
    );
  });

  test('returns placements with multiple distinct solutionCategory values', async () => {
    // Reflects the solutionCategoryMap fixture:
    //   stack, potentialized-union-find, priority-queue, map-dict, ordered-set → DATA_STRUCTURE
    //   bitmask-brute-force-search, greedy-method, recursive-function → SEARCH_SIMULATION
    //   number-theory-search → NUMBER_THEORY
    mockFindMany(solutionPlacements);

    const result = await getPlacementsByWorkBookType(WorkBookType.SOLUTION);
    const categories = result.map((placement) => placement.solutionCategory);

    expect(categories).toContain(SolutionCategory.DATA_STRUCTURE);
    expect(categories).toContain(SolutionCategory.SEARCH_SIMULATION);
    expect(categories).toContain(SolutionCategory.NUMBER_THEORY);
    expect(categories).toContain(SolutionCategory.PENDING);
    expect(result.every((placement) => placement.taskGrade === null)).toBe(true);
  });
});

describe('updateWorkBookPlacements', () => {
  test('updates multiple placements within a transaction', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    const updates = [
      { id: 1, priority: 1, taskGrade: TaskGrade.Q10, solutionCategory: null },
      { id: 2, priority: 2, taskGrade: TaskGrade.Q9, solutionCategory: null },
    ];
    await updateWorkBookPlacements(updates);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  test('does not call transaction when given an empty array', async () => {
    await updateWorkBookPlacements([]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('processes a batch containing both CURRICULUM and SOLUTION placements', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    const updates = [
      { id: 1, priority: 1, taskGrade: TaskGrade.Q10, solutionCategory: null },
      { id: 2, priority: 2, taskGrade: TaskGrade.Q9, solutionCategory: null },
      { id: 101, priority: 1, taskGrade: null, solutionCategory: SolutionCategory.DATA_STRUCTURE },
      {
        id: 102,
        priority: 2,
        taskGrade: null,
        solutionCategory: SolutionCategory.SEARCH_SIMULATION,
      },
    ];
    await updateWorkBookPlacements(updates);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const callArg = vi.mocked(prisma.$transaction).mock.calls[0][0];
    expect(Array.isArray(callArg)).toBe(true);
    expect(callArg).toHaveLength(4);
  });

  test('updates solutionCategory from PENDING to a specific category', async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    // Simulates the admin moving a workbook from PENDING to DATA_STRUCTURE on the Kanban board
    const updates = [
      { id: 104, priority: 3, taskGrade: null, solutionCategory: SolutionCategory.DATA_STRUCTURE },
    ];
    await updateWorkBookPlacements(updates);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('createInitialPlacements', () => {
  test('does nothing when all workbooks are already placed', async () => {
    mockWorkBookFindManyOnce([]); // unplaced CURRICULUM
    mockWorkBookFindManyOnce([]); // unplaced SOLUTION

    await createInitialPlacements();

    expect(prisma.workBookPlacement.createMany).not.toHaveBeenCalled();
  });

  test('creates placements for unplaced curriculum and solution workbooks', async () => {
    // unplacedCurriculumRows: 2 workbooks → 2 curriculum placements
    // unplacedSolutionWorkbooks: 2 workbooks → 2 solution placements (PENDING)
    mockWorkBookFindManyOnce(unplacedCurriculumRows);
    mockWorkBookFindManyOnce(unplacedSolutionWorkbooks);
    vi.mocked(prisma.workBookPlacement.createMany).mockResolvedValue({ count: 4 });

    await createInitialPlacements();

    expect(prisma.workBookPlacement.createMany).toHaveBeenCalledTimes(1);
    const callArg = vi.mocked(prisma.workBookPlacement.createMany).mock.calls[0][0];
    expect(callArg?.data).toHaveLength(4); // 2 curriculum + 2 solution
  });

  test('calls createMany with skipDuplicates to tolerate concurrent double-submit', async () => {
    mockWorkBookFindManyOnce(unplacedCurriculumRows);
    mockWorkBookFindManyOnce(unplacedSolutionWorkbooks);
    vi.mocked(prisma.workBookPlacement.createMany).mockResolvedValue({ count: 4 });

    await createInitialPlacements();

    const callArg = vi.mocked(prisma.workBookPlacement.createMany).mock.calls[0][0];
    expect(callArg?.skipDuplicates).toBe(true);
  });
});

describe('buildTaskMapFromCurriculumRows', () => {
  test('builds a task_id → Task map from nested workbook rows', () => {
    const rows: UnplacedCurriculumRows = [
      {
        id: 1,
        workBookTasks: [
          { task: { task_id: 'math_and_algorithm_a', grade: TaskGrade.Q10 } },
          { task: { task_id: 'tessoku_book_a', grade: TaskGrade.Q10 } },
        ],
      },
      {
        id: 2,
        workBookTasks: [{ task: { task_id: 'tessoku_book_bz', grade: TaskGrade.Q9 } }],
      },
    ];

    const result = buildTaskMapFromCurriculumRows(rows);

    expect(result.size).toBe(3);
    expect(result.get('math_and_algorithm_a')).toMatchObject({
      task_id: 'math_and_algorithm_a',
      grade: TaskGrade.Q10,
    });
    expect(result.get('tessoku_book_bz')).toMatchObject({
      task_id: 'tessoku_book_bz',
      grade: TaskGrade.Q9,
    });
  });

  test('skips workbook tasks where task is null', () => {
    const rows: UnplacedCurriculumRows = [{ id: 1, workBookTasks: [{ task: null }] }];

    expect(buildTaskMapFromCurriculumRows(rows).size).toBe(0);
  });

  test('returns empty map for empty input', () => {
    expect(buildTaskMapFromCurriculumRows([])).toEqual(new Map());
  });
});

describe('buildCurriculumWorkbooksForInit', () => {
  test('converts DB rows to WorkBooksWithTasks shape', () => {
    const rows: UnplacedCurriculumRows = [
      {
        id: 1,
        workBookTasks: [
          { task: { task_id: 'math_and_algorithm_a', grade: TaskGrade.Q10 } },
          { task: { task_id: 'tessoku_book_a', grade: TaskGrade.Q10 } },
        ],
      },
    ];

    const result = buildCurriculumWorkbooksForInit(rows);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 1,
      workBookTasks: [
        { taskId: 'math_and_algorithm_a', priority: 0, comment: '' },
        { taskId: 'tessoku_book_a', priority: 0, comment: '' },
      ],
    });
  });

  test('maps null task to empty string taskId', () => {
    const rows: UnplacedCurriculumRows = [{ id: 1, workBookTasks: [{ task: null }] }];

    const result = buildCurriculumWorkbooksForInit(rows);

    expect(result[0].workBookTasks[0]).toEqual({ taskId: '', priority: 0, comment: '' });
  });

  test('returns empty array for empty input', () => {
    expect(buildCurriculumWorkbooksForInit([])).toEqual([]);
  });
});

describe('initializeCurriculumPlacements', () => {
  test('assigns mode grade and ascending priority within the same grade by workbook id', () => {
    // workBook 1: math_and_algorithm_a (Q10), tessoku_book_a (Q10) → mode Q10, priority 1
    // workBook 2: tessoku_book_bz (Q9), abc169_a (Q9) → mode Q9, priority 1
    // workBook 7: abc219_a (Q10) → mode Q10, priority 2 (same grade as 1, id > 1)
    const workbooks = curriculumWorkbooksForInit.filter((workbook) =>
      [1, 2, 7].includes(workbook.id),
    );

    const result = initializeCurriculumPlacements(workbooks, tasksMapByIds);
    const byId = new Map(result.map((placement) => [placement.workBookId, placement]));

    expect(byId.get(1)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 1 });
    expect(byId.get(2)).toMatchObject({ taskGrade: TaskGrade.Q9, priority: 1 });
    expect(byId.get(7)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 2 });
  });

  test('assigns PENDING to a workbook with no tasks', () => {
    const workbooks = [{ id: 1, workBookTasks: [] }];
    const result = initializeCurriculumPlacements(workbooks, new Map());
    expect(result[0]).toMatchObject({ workBookId: 1, taskGrade: TaskGrade.PENDING, priority: 1 });
  });

  test('returns empty array for empty input', () => {
    expect(initializeCurriculumPlacements([], new Map())).toEqual([]);
  });

  test('assigns correct grades and priorities for fixture-based task data', () => {
    // Reflects actual curriculum workbooks from fixtures/workbooks.ts:
    //   workBook 1: 標準入出力（1 個の整数）→ tasks Q10: math_and_algorithm_a, tessoku_book_a
    //   workBook 2: 標準入出力（2 個以上の整数）→ tasks Q9: tessoku_book_bz, abc169_a
    //   workBook 6: if 文 ① → tasks Q8: abc174_a
    const workbooks = curriculumWorkbooksForInit.filter((workbook) =>
      [1, 2, 6].includes(workbook.id),
    );

    const result = initializeCurriculumPlacements(workbooks, tasksMapByIds);
    const byId = new Map(result.map((placement) => [placement.workBookId, placement]));

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
    const workbooks = curriculumWorkbooksForInit.filter((workbook) => [1, 7].includes(workbook.id));

    const result = initializeCurriculumPlacements(workbooks, tasksMapByIds);
    const byId = new Map(result.map((placement) => [placement.workBookId, placement]));

    expect(byId.get(1)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 1 });
    expect(byId.get(7)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 2 });
  });
});

describe('groupWorkbooksByGrade', () => {
  test('groups workbooks by mode grade and sorts IDs ascending within each group', () => {
    const workbooks = [
      { id: 1, workBookTasks: [] },
      { id: 2, workBookTasks: [] },
      { id: 6, workBookTasks: [] },
    ];
    const gradeModes = new Map([
      [1, TaskGrade.Q10],
      [2, TaskGrade.Q9],
      [6, TaskGrade.Q10],
    ]);

    const result = groupWorkbooksByGrade(workbooks, gradeModes);

    expect(result.get(TaskGrade.Q10)).toEqual([1, 6]);
    expect(result.get(TaskGrade.Q9)).toEqual([2]);
  });

  test('returns empty map for empty input', () => {
    expect(groupWorkbooksByGrade([], new Map()).size).toBe(0);
  });
});

describe('buildPlacementsFromGroups', () => {
  test('assigns priority based on ID order within each grade group', () => {
    const workbooks = [
      { id: 1, workBookTasks: [] },
      { id: 2, workBookTasks: [] },
      { id: 6, workBookTasks: [] },
    ];
    const gradeModes = new Map([
      [1, TaskGrade.Q10],
      [2, TaskGrade.Q9],
      [6, TaskGrade.Q10],
    ]);
    const byGrade = new Map([
      [TaskGrade.Q10, [1, 6]],
      [TaskGrade.Q9, [2]],
    ]);

    const result = buildPlacementsFromGroups(workbooks, gradeModes, byGrade);
    const byId = new Map(result.map((placement) => [placement.workBookId, placement]));

    expect(byId.get(1)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 1 });
    expect(byId.get(6)).toMatchObject({ taskGrade: TaskGrade.Q10, priority: 2 });
    expect(byId.get(2)).toMatchObject({ taskGrade: TaskGrade.Q9, priority: 1 });
  });

  test('sets solutionCategory to null for all records', () => {
    const workbooks = [{ id: 1, workBookTasks: [] }];
    const gradeModes = new Map([[1, TaskGrade.Q10]]);
    const byGrade = new Map([[TaskGrade.Q10, [1]]]);

    const result = buildPlacementsFromGroups(workbooks, gradeModes, byGrade);

    expect(result[0].solutionCategory).toBeNull();
  });
});

describe('initializeSolutionPlacements', () => {
  test('initializes all workbooks with PENDING and sequential priority', () => {
    const workbooks = [{ id: 31 }, { id: 33 }];
    const result = initializeSolutionPlacements(workbooks);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      workBookId: 31,
      solutionCategory: SolutionCategory.PENDING,
      taskGrade: null,
      priority: 1,
    });
    expect(result[1]).toMatchObject({
      workBookId: 33,
      solutionCategory: SolutionCategory.PENDING,
      taskGrade: null,
      priority: 2,
    });
  });

  test('returns empty array for empty input', () => {
    expect(initializeSolutionPlacements([])).toEqual([]);
  });

  test('assigns sequential priorities regardless of workbook id order', () => {
    // Workbooks may arrive from DB in non-sequential ID order
    const workbooks = [{ id: 40 }, { id: 31 }, { id: 33 }];
    const result = initializeSolutionPlacements(workbooks);

    expect(result[0]).toMatchObject({ workBookId: 40, priority: 1 });
    expect(result[1]).toMatchObject({ workBookId: 31, priority: 2 });
    expect(result[2]).toMatchObject({ workBookId: 33, priority: 3 });
    expect(result.every((placement) => placement.taskGrade === null)).toBe(true);
  });
});

describe('validateAndUpdatePlacements', () => {
  test('returns null and calls upsert when all updates are valid', async () => {
    mockPlacementFindManyOnce([curriculumPlacementRow]);
    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    const result = await validateAndUpdatePlacements([
      { id: 1, priority: 2, taskGrade: TaskGrade.Q10, solutionCategory: null },
    ]);

    expect(result).toBeNull();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  test('returns error when placement id does not exist', async () => {
    mockPlacementFindManyOnce([]);

    const result = await validateAndUpdatePlacements([
      { id: 999, priority: 1, taskGrade: null, solutionCategory: SolutionCategory.GRAPH },
    ]);

    expect(result).toMatchObject({ error: expect.stringContaining('999') });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('returns error for CURRICULUM → SOLUTION cross-type movement', async () => {
    mockPlacementFindManyOnce([curriculumPlacementRow]);

    const result = await validateAndUpdatePlacements([
      { id: 1, priority: 1, taskGrade: null, solutionCategory: SolutionCategory.GRAPH },
    ]);

    expect(result).toMatchObject({ error: expect.stringContaining('not allowed') });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test('returns error for SOLUTION → CURRICULUM cross-type movement', async () => {
    mockPlacementFindManyOnce([solutionPlacementRow]);

    const result = await validateAndUpdatePlacements([
      { id: 101, priority: 1, taskGrade: TaskGrade.Q10, solutionCategory: null },
    ]);

    expect(result).toMatchObject({ error: expect.stringContaining('not allowed') });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('createWorkBookPlacements', () => {
  test('calls createMany when given placement data', async () => {
    vi.mocked(prisma.workBookPlacement.createMany).mockResolvedValue({ count: 2 });

    await createWorkBookPlacements([
      { workBookId: 1, taskGrade: TaskGrade.Q10, solutionCategory: null, priority: 1 },
      {
        workBookId: 31,
        taskGrade: null,
        solutionCategory: SolutionCategory.DATA_STRUCTURE,
        priority: 1,
      },
    ]);

    expect(prisma.workBookPlacement.createMany).toHaveBeenCalledTimes(1);
  });

  test('does not call createMany when given an empty array', async () => {
    await createWorkBookPlacements([]);
    expect(prisma.workBookPlacement.createMany).not.toHaveBeenCalled();
  });
});
