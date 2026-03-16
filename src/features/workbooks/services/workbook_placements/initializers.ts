import { type Task, type TaskGrade } from '$lib/types/task';
import {
  SolutionCategory,
  type WorkBooksWithTasks,
  type PlacementCreates,
  type UnplacedCurriculumRows,
} from '$features/workbooks/types/workbook_placement';

import { calcWorkBookGradeModes } from '$features/workbooks/utils/workbooks';

// --- Curriculum-specific initialization ---

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
  tasksMapByIds: Map<string, Task>,
): PlacementCreates {
  const gradeModes = calcWorkBookGradeModes(workbooks, tasksMapByIds);
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

// --- Solution-specific initialization ---

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
