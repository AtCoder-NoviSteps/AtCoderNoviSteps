import type { WorkBook, WorkBookTaskBase } from '$lib/types/workbook';

export async function getWorkBookTasks(workBook: WorkBook) {
  const workBookTasks: WorkBookTaskBase[] = await Promise.all(
    workBook.workBookTasks.map(async (workBookTask) => {
      return { taskId: workBookTask.taskId, priority: workBookTask.priority };
    }),
  );

  return workBookTasks;
}

export function validateRequiredFields(workBookTasks: WorkBookTaskBase[]) {
  workBookTasks.forEach((task, index) => {
    if (!task.taskId || !task.priority) {
      throw new Error(`Not found required fields for WorkBookTask at index ${index}.`);
    }
  });
}
