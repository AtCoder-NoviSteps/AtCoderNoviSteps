import { TaskGrade, type Task } from '$lib/types/task';
import { WorkBookType } from '$features/workbooks/types/workbook';
import {
  SolutionCategory,
  type WorkBookPlacements,
  type WorkbooksWithPlacement,
  type WorkBooksWithTasks,
  type UnplacedCurriculumRows,
} from '$features/workbooks/types/workbook_placement';

// ---------------------------------------------------------------------------
// Placement records (WorkBookPlacement shape)
// ---------------------------------------------------------------------------

// CURRICULUM placements reflecting seed data order:
//   workBook 1: 標準入出力（1 個の整数）→ tasks Q10: math_and_algorithm_a, tessoku_book_a, ...
//   workBook 2: 標準入出力（2 個以上の整数）→ tasks Q9: tessoku_book_bz, abc169_a, ...
//   workBook 6: if 文 ① → tasks Q8: abc174_a, abc334_a, ...
export const curriculumPlacements: WorkBookPlacements = [
  { id: 1, workBookId: 1, taskGrade: TaskGrade.Q10, solutionCategory: null, priority: 1 },
  { id: 2, workBookId: 2, taskGrade: TaskGrade.Q9, solutionCategory: null, priority: 1 },
  { id: 6, workBookId: 6, taskGrade: TaskGrade.Q8, solutionCategory: null, priority: 1 },
];

// SOLUTION placements reflecting solutionCategoryMap:
//   stack (workBook 31) → DATA_STRUCTURE
//   bitmask-brute-force-search (workBook 33) → SEARCH_SIMULATION
//   number-theory-search (workBook 40) → NUMBER_THEORY
//   unlisted workbook (workBook 99) → PENDING (initial state before admin categorizes)
export const solutionPlacements: WorkBookPlacements = [
  {
    id: 101,
    workBookId: 31,
    taskGrade: null,
    solutionCategory: SolutionCategory.DATA_STRUCTURE,
    priority: 1,
  },
  {
    id: 102,
    workBookId: 33,
    taskGrade: null,
    solutionCategory: SolutionCategory.SEARCH_SIMULATION,
    priority: 1,
  },
  {
    id: 103,
    workBookId: 40,
    taskGrade: null,
    solutionCategory: SolutionCategory.NUMBER_THEORY,
    priority: 1,
  },
  {
    id: 104,
    workBookId: 99,
    taskGrade: null,
    solutionCategory: SolutionCategory.PENDING,
    priority: 2,
  },
];

// ---------------------------------------------------------------------------
// Workbooks with placements (returned by getWorkbooksWithPlacements)
// ---------------------------------------------------------------------------

export const workbooksWithPlacements: WorkbooksWithPlacement = [
  {
    id: 1,
    title: '標準入出力（1 個の整数）',
    isPublished: true,
    workBookType: WorkBookType.CURRICULUM,
    placement: curriculumPlacements[0],
  },
  {
    id: 31,
    title: 'スタック（stack）',
    isPublished: true,
    workBookType: WorkBookType.SOLUTION,
    placement: solutionPlacements[0],
  },
  {
    id: 99,
    title: '未分類問題集',
    isPublished: false,
    workBookType: WorkBookType.SOLUTION,
    placement: null,
  },
];

// ---------------------------------------------------------------------------
// DB row shapes used in validateAndUpdatePlacements tests
// (WorkBookPlacement + workBook relation from Prisma include)
// ---------------------------------------------------------------------------

export const curriculumPlacementRow = {
  ...curriculumPlacements[0],
  workBook: { workBookType: WorkBookType.CURRICULUM },
};

export const solutionPlacementRow = {
  ...solutionPlacements[0],
  workBook: { workBookType: WorkBookType.SOLUTION },
};

// ---------------------------------------------------------------------------
// Task map (used by initializeCurriculumPlacements tests)
// Task IDs match those in fixtures/workbooks.ts CURRICULUM/SOLUTION workbooks
// ---------------------------------------------------------------------------

export const tasksMapByIds = new Map<string, Task>([
  [
    'math_and_algorithm_a',
    {
      task_id: 'math_and_algorithm_a',
      contest_id: 'math_and_algorithm',
      task_table_index: 'A',
      title: '001. Print 5+N',
      grade: TaskGrade.Q10,
    },
  ],
  [
    'tessoku_book_a',
    {
      task_id: 'tessoku_book_a',
      contest_id: 'tessoku_book',
      task_table_index: 'A',
      title: 'A01. The First Problem',
      grade: TaskGrade.Q10,
    },
  ],
  [
    'tessoku_book_bz',
    {
      task_id: 'tessoku_book_bz',
      contest_id: 'tessoku_book',
      task_table_index: 'BZ',
      title: 'B01. A+B Problem',
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
  [
    'abc219_a',
    {
      task_id: 'abc219_a',
      contest_id: 'abc219',
      task_table_index: 'A',
      title: 'A. AtCoder Judge',
      grade: TaskGrade.Q10,
    },
  ],
]);

// ---------------------------------------------------------------------------
// Curriculum workbooks for initializeCurriculumPlacements tests
// (WorkBooksWithTasks shape — reflects fixtures/workbooks.ts entries 1, 2, 6, 7)
// ---------------------------------------------------------------------------

export const curriculumWorkbooksForInit: WorkBooksWithTasks = [
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
  { id: 7, workBookTasks: [{ taskId: 'abc219_a', priority: 1, comment: '' }] },
];

// ---------------------------------------------------------------------------
// Unplaced workbook shapes for createInitialPlacements tests
// (shapes returned by fetchUnplacedWorkbooks internals)
// ---------------------------------------------------------------------------

export const unplacedCurriculumRows: UnplacedCurriculumRows = [
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

export const unplacedSolutionWorkbooks = [{ id: 31 }, { id: 33 }];
