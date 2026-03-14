import { Roles } from '$lib/types/user';
import { TaskGrade, type Task, type TaskGrades } from '$lib/types/task';
import type { WorkBook, WorkbookList, WorkBookTaskBase } from '$features/workbooks/types/workbook';

import { isAdmin } from '$lib/utils/authorship';
import { calcGradeMode } from '$lib/utils/task';

// 管理者 + ユーザ向けに公開されている場合
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
