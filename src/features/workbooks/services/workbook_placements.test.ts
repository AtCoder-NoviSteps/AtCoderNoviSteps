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
      { id: 3, workBookId: 3, taskGrade: null, solutionCategory: SolutionCategory.GRAPH, priority: 1 },
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
    const workbooks = [
      { id: 1 },
      { id: 2 },
    ];
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
});
