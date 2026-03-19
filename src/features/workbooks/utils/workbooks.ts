import { Roles } from '$lib/types/user';
import {
  TaskGrade,
  type Task,
  type TaskGrades,
  type TaskResult,
  type TaskResults,
} from '$lib/types/task';
import type {
  WorkBook,
  WorkbookList,
  WorkbooksList,
  WorkBookTaskBase,
  WorkBookType,
} from '$features/workbooks/types/workbook';

import { isAdmin, canRead } from '$lib/utils/authorship';
import { calcGradeMode } from '$lib/utils/task';

/** Returns true when the user can view the workbook: admins always can; others only when published. */
export function canViewWorkBook(role: Roles, isPublished: boolean) {
  return isAdmin(role) || isPublished;
}

/**
 * Gets the URL slug for a workbook, falling back to the workbook ID if no slug is available.
 *
 * @param workbook - The workbook object containing urlSlug and id properties
 * @returns The URL slug if available, otherwise the workbook ID as a string
 */
export function getUrlSlugFrom(workbook: WorkbookList | WorkBook): string {
  const slug = workbook.urlSlug;

  return slug ? slug : workbook.id.toString();
}

/**
 * Filters workbooks by type.
 */
export function getWorkBooksByType(
  workbooks: WorkbooksList,
  workBookType: WorkBookType,
): WorkbooksList {
  return workbooks.filter((workbook: WorkbookList) => workbook.workBookType === workBookType);
}

/**
 * Builds a map from workbook ID to the task results for that workbook's tasks.
 * Workbooks with no matching task results are omitted from the map.
 */
export function buildTaskResultsByWorkBookId(
  workbooks: WorkbooksList,
  taskResultsByTaskId: Map<string, TaskResult>,
): Map<number, TaskResults> {
  const taskResultsWithWorkBookId = new Map<number, TaskResults>();

  workbooks.forEach((workbook: WorkbookList) => {
    const taskResults: TaskResults = workbook.workBookTasks.reduce(
      (array: TaskResults, workBookTask: WorkBookTaskBase) => {
        const taskResult = taskResultsByTaskId.get(workBookTask.taskId);

        if (taskResult !== undefined) {
          array.push(taskResult);
        }

        return array;
      },
      [],
    );

    if (taskResults.length > 0) {
      taskResultsWithWorkBookId.set(workbook.id, taskResults);
    }
  });

  return taskResultsWithWorkBookId;
}

/**
 * Calculates the grade modes for a list of workbooks in curriculum based on their tasks.
 *
 * @param workbooks - Workbooks with their task lists (only `id` and `workBookTasks` are used)
 * @param tasksMapByIds - A map of task IDs to task objects
 *
 * @returns A map of workbook IDs to their corresponding grade modes
 * @note The time complexity is O(N * M * log(M)), where N is the number of workbooks and M is the average number of tasks per workbook.
 */
export function calcWorkBookGradeModes(
  workbooks: { id: number; workBookTasks: WorkBookTaskBase[] }[],
  tasksMapByIds: Map<string, Task>,
): Map<number, TaskGrade> {
  const gradeModes: Map<number, TaskGrade> = new Map();

  workbooks.forEach((workbook: { id: number; workBookTasks: WorkBookTaskBase[] }) => {
    const taskGrades = workbook.workBookTasks.reduce(
      (results: TaskGrades, workBookTask: WorkBookTaskBase) => {
        const task = tasksMapByIds.get(workBookTask.taskId);

        if (task && task.grade !== TaskGrade.PENDING) {
          results.push(task.grade as TaskGrade);
        }

        return results;
      },
      [],
    );

    gradeModes.set(workbook.id, calcGradeMode(taskGrades));
  });

  return gradeModes;
}

/** Returns the grade mode for a workbook, falling back to PENDING when not found in the map. */
export function getGradeMode(workbookId: number, gradeModes: Map<number, TaskGrade>): TaskGrade {
  return gradeModes.get(workbookId) ?? TaskGrade.PENDING;
}

/** Returns the number of workbooks the given user can read. */
export function countReadableWorkbooks(workbooks: WorkbooksList, userId: string): number {
  return workbooks.reduce((count, workbook) => {
    const hasReadPermission = canRead(workbook.isPublished, userId, workbook.authorId);
    return count + (hasReadPermission ? 1 : 0);
  }, 0);
}

const EMPTY_TASK_RESULTS: TaskResults = [];

/** Returns the task results for a workbook, falling back to an empty array when not found in the map. */
export function getTaskResult(
  workbookId: number,
  taskResults: Map<number, TaskResults>,
): TaskResults {
  return taskResults.get(workbookId) ?? EMPTY_TASK_RESULTS;
}
