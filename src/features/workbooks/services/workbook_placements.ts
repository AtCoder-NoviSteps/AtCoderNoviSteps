import prisma from '$lib/server/database';

import { type Task, type TaskGrade } from '$lib/types/task';
import {
  SolutionCategory,
  type WorkBookPlacement,
  type WorkBookPlacements,
  type PlacementInput,
  type WorkBookWithTasks,
  type PlacementCreate,
} from '$features/workbooks/types/workbook_placement';

import { calcWorkBookGradeModes } from '$features/workbooks/utils/workbooks';

/** @internal Shape of a workbook row from the DB query for unplaced curriculum workbooks. */
type UnplacedCurriculumRow = {
  id: number;
  workBookTasks: { task: { task_id: string; grade: TaskGrade } | null }[];
};

/**
 * Returns all placements for workbooks of the given type, ordered by priority.
 */
export async function getWorkBookPlacements(
  workBookType: 'CURRICULUM' | 'SOLUTION',
): Promise<WorkBookPlacements> {
  return prisma.workBookPlacement.findMany({
    where: { workBook: { workBookType } },
    orderBy: { priority: 'asc' },
  });
}

/**
 * Updates existing placements in a single transaction.
 * No-op when given an empty array.
 */
export async function upsertWorkBookPlacements(updatedPlacements: PlacementInput[]): Promise<void> {
  if (updatedPlacements.length === 0) {
    return;
  }

  await prisma.$transaction(
    updatedPlacements.map((updatedPlacement) =>
      prisma.workBookPlacement.update({
        where: { id: updatedPlacement.id },
        data: {
          priority: updatedPlacement.priority,
          taskGrade: updatedPlacement.taskGrade ?? null,
          solutionCategory: updatedPlacement.solutionCategory ?? null,
        },
      }),
    ),
  );
}

/**
 * Builds a task lookup map from unplaced curriculum workbook rows.
 * Stub tasks include only task_id and grade; other fields are left empty.
 */
export function buildTasksByTaskId(workbooks: UnplacedCurriculumRow[]): Map<string, Task> {
  const tasksByTaskId = new Map<string, Task>();

  for (const workbook of workbooks) {
    for (const workBookTask of workbook.workBookTasks) {
      if (workBookTask.task) {
        tasksByTaskId.set(workBookTask.task.task_id, {
          task_id: workBookTask.task.task_id,
          contest_id: '',
          task_table_index: '',
          title: '',
          grade: workBookTask.task.grade,
        });
      }
    }
  }

  return tasksByTaskId;
}

/**
 * Converts unplaced curriculum DB rows into the shape expected by initializeCurriculumPlacements.
 */
export function buildCurriculumWorkbooksForInit(
  workbooks: UnplacedCurriculumRow[],
): WorkBookWithTasks[] {
  return workbooks.map((workbook) => ({
    id: workbook.id,
    workBookTasks: workbook.workBookTasks.map((workBookTask) => ({
      taskId: workBookTask.task?.task_id ?? '',
      priority: 0,
      comment: '',
    })),
  }));
}

/**
 * Returns initial placement records for unplaced SOLUTION workbooks.
 * All are placed in the PENDING category with sequential priority.
 */
export function initializeSolutionPlacements(workbooks: { id: number }[]): PlacementCreate[] {
  return workbooks.map((workBook, i) => ({
    workBookId: workBook.id,
    taskGrade: null,
    solutionCategory: SolutionCategory.PENDING,
    priority: i + 1,
  }));
}

/**
 * Returns initial placement records for unplaced CURRICULUM workbooks.
 * Each workbook is assigned the mode grade of its tasks, with priority
 * determined by ascending workbook ID within each grade group.
 */
export function initializeCurriculumPlacements(
  workbooks: WorkBookWithTasks[],
  tasksByTaskId: Map<string, Task>,
): PlacementCreate[] {
  const gradeModes = calcWorkBookGradeModes(workbooks, tasksByTaskId);

  // Group by grade and sort by workbook ID ascending for deterministic priority assignment.
  const byGrade = new Map<TaskGrade, number[]>();

  for (const workbook of workbooks) {
    const grade = gradeModes.get(workbook.id)!;

    if (!byGrade.has(grade)) {
      byGrade.set(grade, []);
    }

    byGrade.get(grade)!.push(workbook.id);
  }

  for (const ids of byGrade.values()) {
    ids.sort((a, b) => a - b);
  }

  const result: PlacementCreate[] = [];

  for (const workbook of workbooks) {
    const grade = gradeModes.get(workbook.id)!;
    const ids = byGrade.get(grade)!;
    const priority = ids.indexOf(workbook.id) + 1;

    result.push({ workBookId: workbook.id, taskGrade: grade, solutionCategory: null, priority });
  }

  return result;
}

/**
 * Queries all unplaced CURRICULUM and SOLUTION workbooks, computes their initial
 * placements, and writes them to the database in a single createMany call.
 * No-op when all workbooks are already placed.
 */
export async function createInitialPlacements(): Promise<void> {
  const [unplacedCurriculum, unplacedSolution] = await Promise.all([
    prisma.workBook.findMany({
      where: { workBookType: 'CURRICULUM', placement: null },
      include: {
        workBookTasks: {
          include: { task: { select: { task_id: true, grade: true } } },
        },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.workBook.findMany({
      where: { workBookType: 'SOLUTION', placement: null },
      orderBy: { id: 'asc' },
    }),
  ]);

  if (unplacedCurriculum.length === 0 && unplacedSolution.length === 0) {
    return;
  }

  const tasksByTaskId = buildTasksByTaskId(unplacedCurriculum);
  const curriculumWorkbooksForInit = buildCurriculumWorkbooksForInit(unplacedCurriculum);

  const curriculumPlacements = initializeCurriculumPlacements(
    curriculumWorkbooksForInit,
    tasksByTaskId,
  );
  const solutionPlacements = initializeSolutionPlacements(unplacedSolution);

  await prisma.workBookPlacement.createMany({
    data: [...curriculumPlacements, ...solutionPlacements],
  });
}

// Re-export for consumers that only need the placement type (e.g. +server.ts upsert).
export type { WorkBookPlacement };
