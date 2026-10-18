import { TaskGrade } from '#lib/types/task.js';
import { WorkBookType } from '#features/workbooks/types/workbook.js';
import {
  SolutionCategory,
  type WorkbooksWithPlacement,
} from '#features/workbooks/types/workbook_placement.js';
import type { KanbanColumns } from '../_types/kanban';

// Workbooks used in buildKanbanItems tests.
// Covers SOLUTION (GRAPH, DYNAMIC_PROGRAMMING, PENDING), CURRICULUM (Q10), and null placement.
export const workbooks: WorkbooksWithPlacement = [
  {
    id: 1,
    title: 'Graph Basics',
    isPublished: true,
    workBookType: WorkBookType.SOLUTION,
    placement: {
      id: 101,
      workBookId: 1,
      solutionCategory: SolutionCategory.GRAPH,
      taskGrade: null,
      priority: 1,
    },
  },
  {
    id: 2,
    title: 'DP Intro',
    isPublished: false,
    workBookType: WorkBookType.SOLUTION,
    placement: {
      id: 102,
      workBookId: 2,
      solutionCategory: SolutionCategory.DYNAMIC_PROGRAMMING,
      taskGrade: null,
      priority: 2,
    },
  },
  {
    id: 3,
    title: 'Pending Book',
    isPublished: true,
    workBookType: WorkBookType.SOLUTION,
    placement: {
      id: 103,
      workBookId: 3,
      solutionCategory: SolutionCategory.PENDING,
      taskGrade: null,
      priority: 1,
    },
  },
  {
    id: 4,
    title: 'Curriculum Q10',
    isPublished: true,
    workBookType: WorkBookType.CURRICULUM,
    placement: {
      id: 201,
      workBookId: 4,
      solutionCategory: null,
      taskGrade: TaskGrade.Q10,
      priority: 1,
    },
  },
  {
    id: 5,
    title: 'No placement',
    isPublished: true,
    workBookType: WorkBookType.SOLUTION,
    placement: null,
  },
];

// "Before drag" baseline: GRAPH has two cards and PENDING has one.
export const solutionColumnsBefore: KanbanColumns = {
  [SolutionCategory.GRAPH]: [
    { id: 101, workBookId: 1, title: 'Graph Basics', isPublished: true },
    { id: 102, workBookId: 2, title: 'Graph Advanced', isPublished: false },
  ],
  [SolutionCategory.PENDING]: [
    { id: 103, workBookId: 3, title: 'Pending Book', isPublished: true },
  ],
};

// solutionColumnsBefore with the two GRAPH cards swapped; PENDING is unchanged.
export const solutionColumnsGraphSwapped: KanbanColumns = {
  ...solutionColumnsBefore,
  [SolutionCategory.GRAPH]: [
    solutionColumnsBefore[SolutionCategory.GRAPH][1],
    solutionColumnsBefore[SolutionCategory.GRAPH][0],
  ],
};
