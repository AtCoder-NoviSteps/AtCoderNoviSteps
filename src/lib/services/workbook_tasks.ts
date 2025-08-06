import type { WorkBook, WorkBookTaskBase, WorkBookTasksBase } from '$lib/types/workbook';

export async function getWorkBookTasks(workBook: Omit<WorkBook, 'id'>): Promise<WorkBookTasksBase> {
  const workBookTasks: WorkBookTasksBase = await Promise.all(
    workBook.workBookTasks.map(async (workBookTask: WorkBookTaskBase) => {
      return {
        taskId: workBookTask.taskId,
        priority: workBookTask.priority,
        comment: workBookTask.comment,
      };
    }),
  );

  return workBookTasks;
}

export function validateRequiredFields(workBookTasks: WorkBookTasksBase): void {
  workBookTasks.forEach((task, index) => {
    if (!task.taskId || !task.priority) {
      throw new Error(`Not found required fields for WorkBookTask at index ${index}.`);
    }
  });
}
