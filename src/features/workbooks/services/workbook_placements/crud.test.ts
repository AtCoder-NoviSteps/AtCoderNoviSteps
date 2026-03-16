import { describe, test, expect, vi, beforeEach } from 'vitest';

import { TaskGrade } from '$lib/types/task';
import { WorkBookType } from '$features/workbooks/types/workbook';
import {
  SolutionCategory,
  type WorkBookPlacements,
} from '$features/workbooks/types/workbook_placement';

import {
  getWorkbooksWithPlacements,
  getPlacementsByWorkBookType,
  updateWorkBookPlacements,
  createInitialPlacements,
  validateAndUpdatePlacements,
  createWorkBookPlacements,
} from './crud';

import {
  curriculumPlacements,
  solutionPlacements,
  workbooksWithPlacements,
  curriculumPlacementRow,
  solutionPlacementRow,
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
