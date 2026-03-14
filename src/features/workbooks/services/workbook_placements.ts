import prisma from '$lib/server/database';

import { type Task, type TaskGrade } from '$lib/types/task';
import {
  SolutionCategory,
  type WorkBookPlacement,
  type WorkBookPlacements,
  type WorkbooksWithPlacement,
  type PlacementInputs,
  type WorkBooksWithTasks,
  type PlacementCreates,
  type UnplacedCurriculumRows,
} from '$features/workbooks/types/workbook_placement';

import { WorkBookType } from '$features/workbooks/types/workbook';

import { calcWorkBookGradeModes } from '$features/workbooks/utils/workbooks';

// --- 1. Basic CRUD operations for placements ---

/**
 * Returns all CURRICULUM and SOLUTION workbooks with their placements, ordered by id.
 */
export async function getWorkbooksWithPlacements(): Promise<WorkbooksWithPlacement> {
  return prisma.workBook.findMany({
    where: { workBookType: { in: [WorkBookType.CURRICULUM, WorkBookType.SOLUTION] } },
    include: { placement: true },
    orderBy: { id: 'asc' },
  });
}

/**
 * Returns all placements for workbooks of the given type, ordered by priority.
 */
export async function getPlacementsByWorkBookType(
  workBookType: typeof WorkBookType.CURRICULUM | typeof WorkBookType.SOLUTION,
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
export async function updateWorkBookPlacements(updatedPlacements: PlacementInputs): Promise<void> {
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

// --- 2. Curriculum-specific initialization ---

/**
 * Queries all unplaced CURRICULUM and SOLUTION workbooks, computes their initial
 * placements, and writes them to the database in a single createMany call.
 * No-op when all workbooks are already placed.
 */
export async function createInitialPlacements(): Promise<void> {
  const { unplacedCurriculum, unplacedSolution } = await fetchUnplacedWorkbooks();

  if (unplacedCurriculum.length === 0 && unplacedSolution.length === 0) {
    return;
  }

  const tasksByTaskId = buildTaskMapFromCurriculumRows(unplacedCurriculum);
  const curriculumWorkbooksForInit = buildCurriculumWorkbooksForInit(unplacedCurriculum);

  const curriculumPlacements = initializeCurriculumPlacements(
    curriculumWorkbooksForInit,
    tasksByTaskId,
  );
  const solutionPlacements = initializeSolutionPlacements(unplacedSolution);

  await prisma.workBookPlacement.createMany({
    data: [...curriculumPlacements, ...solutionPlacements],
    skipDuplicates: true,
  });
}

async function fetchUnplacedWorkbooks() {
  const [unplacedCurriculum, unplacedSolution] = await Promise.all([
    prisma.workBook.findMany({
      where: { workBookType: WorkBookType.CURRICULUM, placement: null },
      include: {
        workBookTasks: {
          include: { task: { select: { task_id: true, grade: true } } },
        },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.workBook.findMany({
      where: { workBookType: WorkBookType.SOLUTION, placement: null },
      orderBy: { id: 'asc' },
    }),
  ]);

  return { unplacedCurriculum, unplacedSolution };
}

/**
 * Builds a task lookup map from unplaced curriculum workbook rows.
 * Stub tasks include only task_id and grade; other fields are left empty.
 */
export function buildTaskMapFromCurriculumRows(
  workbooks: UnplacedCurriculumRows,
): Map<string, Task> {
  return new Map(
    workbooks
      .flatMap((workbook) => workbook.workBookTasks)
      .filter((workBookTask) => workBookTask.task !== null)
      .map((workBookTask) => [
        workBookTask.task!.task_id,
        {
          task_id: workBookTask.task!.task_id,
          contest_id: '',
          task_table_index: '',
          title: '',
          grade: workBookTask.task!.grade,
        },
      ]),
  );
}

/**
 * Converts unplaced curriculum DB rows into the shape expected by initializeCurriculumPlacements.
 */
export function buildCurriculumWorkbooksForInit(
  workbooks: UnplacedCurriculumRows,
): WorkBooksWithTasks {
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
 * Returns initial placement records for unplaced CURRICULUM workbooks.
 * Each workbook is assigned the mode grade of its tasks, with priority
 * determined by ascending workbook ID within each grade group.
 */
export function initializeCurriculumPlacements(
  workbooks: WorkBooksWithTasks,
  tasksByTaskId: Map<string, Task>,
): PlacementCreates {
  const gradeModes = calcWorkBookGradeModes(workbooks, tasksByTaskId);
  const byGrade = groupWorkbooksByGrade(workbooks, gradeModes);
  return buildPlacementsFromGroups(workbooks, gradeModes, byGrade);
}

/**
 * Groups workbooks by their mode grade, sorted by workbook ID ascending within each group.
 */
export function groupWorkbooksByGrade(
  workbooks: WorkBooksWithTasks,
  gradeModes: Map<number, TaskGrade>,
): Map<TaskGrade, number[]> {
  return workbooks.reduce((byGrade, workbook) => {
    const grade = gradeModes.get(workbook.id)!;
    const ids = [...(byGrade.get(grade) ?? []), workbook.id].sort((a, b) => a - b);
    return byGrade.set(grade, ids);
  }, new Map<TaskGrade, number[]>());
}

/**
 * Builds PlacementCreate records from pre-grouped grade data.
 * Priority is the 1-based index within each grade group (sorted by workbook ID).
 */
export function buildPlacementsFromGroups(
  workbooks: WorkBooksWithTasks,
  gradeModes: Map<number, TaskGrade>,
  byGrade: Map<TaskGrade, number[]>,
): PlacementCreates {
  return workbooks.map((workbook) => {
    const grade = gradeModes.get(workbook.id)!;
    const ids = byGrade.get(grade)!;
    const priority = ids.indexOf(workbook.id) + 1;
    return { workBookId: workbook.id, taskGrade: grade, solutionCategory: null, priority };
  });
}

// --- 3. Solution-specific initialization ---

/**
 * Returns initial placement records for unplaced SOLUTION workbooks.
 * All are placed in the PENDING category with sequential priority.
 */
export function initializeSolutionPlacements(workbooks: { id: number }[]): PlacementCreates {
  return workbooks.map((workBook, i) => ({
    workBookId: workBook.id,
    taskGrade: null,
    solutionCategory: SolutionCategory.PENDING,
    priority: i + 1,
  }));
}

// --- 4. Common logic for both curriculum and solution ---

/**
 * Validates that no update crosses CURRICULUM/SOLUTION boundary, then upserts.
 * Returns { error } on validation failure, null on success.
 */
export async function validateAndUpdatePlacements(
  updates: PlacementInputs,
): Promise<{ error: string } | null> {
  const validationError = await validatePlacements(updates);

  if (validationError) {
    return validationError;
  }

  await updateWorkBookPlacements(updates);

  return null;
}

async function validatePlacements(updates: PlacementInputs): Promise<{ error: string } | null> {
  const ids = updates.map((update) => update.id);
  const existingPlacements = await prisma.workBookPlacement.findMany({
    where: { id: { in: ids } },
    include: { workBook: { select: { workBookType: true } } },
  });

  const existingById = new Map(existingPlacements.map((placement) => [placement.id, placement]));

  for (const update of updates) {
    const existing = existingById.get(update.id);

    if (!existing) {
      return { error: `Not found placement id=${update.id}` };
    }

    const isCurriculumToSolution =
      existing.workBook.workBookType === WorkBookType.CURRICULUM &&
      update.solutionCategory !== null;
    const isSolutionToCurriculum =
      existing.workBook.workBookType === WorkBookType.SOLUTION && update.taskGrade !== null;

    if (isCurriculumToSolution || isSolutionToCurriculum) {
      return { error: 'Moving between CURRICULUM and SOLUTION is not allowed' };
    }
  }

  return null;
}

// --- 5. Only used for seeding initial placements, not exposed to runtime code ---

/**
 * Persists an array of new placement records to the database.
 */
export async function createWorkBookPlacements(placements: PlacementCreates): Promise<void> {
  if (placements.length === 0) {
    return;
  }

  await prisma.workBookPlacement.createMany({ data: placements });
}

// Re-export for consumers that only need the placement type (e.g. +server.ts upsert).
export type { WorkBookPlacement };
