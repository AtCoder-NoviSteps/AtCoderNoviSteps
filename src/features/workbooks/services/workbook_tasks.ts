import type { WorkBook, WorkBookTasksBase } from '$features/workbooks/types/workbook';

export function getWorkBookTasks(workBook: Omit<WorkBook, 'id'>): WorkBookTasksBase {
  return workBook.workBookTasks.map((workBookTask) => ({
    taskId: workBookTask.taskId,
    priority: workBookTask.priority,
    comment: workBookTask.comment,
  }));
}

export function validateRequiredFields(workBookTasks: WorkBookTasksBase): void {
  workBookTasks.forEach((task, index) => {
    if (!task.taskId || !task.priority) {
      throw new Error(`Not found required fields for WorkBookTask at index ${index}.`);
    }
  });
}
