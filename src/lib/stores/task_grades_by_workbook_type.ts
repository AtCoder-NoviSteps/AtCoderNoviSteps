import { get, writable } from 'svelte/store';

import { WorkBookType } from '$lib/types/workbook';
import { TaskGrade } from '$lib/types/task';

const workBookTypes = Object.values(WorkBookType) as Array<WorkBookType>;
const initialValues = new Map<WorkBookType, TaskGrade>(
  workBookTypes.map((workBookType: WorkBookType) => [workBookType, TaskGrade.Q10]),
);

function createTaskGradesByWorkBookTypeStore() {
  const { subscribe, update } = writable(initialValues);

  return {
    subscribe,
    updateTaskGrade: (workBookType: WorkBookType, grade: TaskGrade) =>
      update((originalTaskGrades) => new Map(originalTaskGrades.set(workBookType, grade))),
    getTaskGrade: (workBookType: WorkBookType) => {
      const taskGrades = get({ subscribe });
      return taskGrades.get(workBookType);
    },
  };
}

export const taskGradesByWorkBookTypeStore = createTaskGradesByWorkBookTypeStore();
