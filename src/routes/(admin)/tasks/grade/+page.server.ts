import type { Actions, PageServerLoad } from './$types';

import { type TaskGrade, TaskGrade as TaskGradeEnum } from '$lib/types/task';

import { updateTask } from '$lib/services/tasks';
import { getAllTasksWithVoteInfo } from '$features/votes/services/vote_statistics';
import { validateAdminAccess } from '$features/auth/services/admin_access';

export const load: PageServerLoad = async ({ locals, url }) => {
  await validateAdminAccess(locals, url);

  const tasks = await getAllTasksWithVoteInfo();

  return { tasks };
};

export const actions: Actions = {
  setTaskGrade: async ({ request, locals }) => {
    await validateAdminAccess(locals);

    const data = await request.formData();
    const taskId = data.get('taskId');
    const grade = data.get('grade');

    if (
      typeof taskId !== 'string' ||
      !taskId ||
      typeof grade !== 'string' ||
      !(Object.values(TaskGradeEnum) as string[]).includes(grade)
    ) {
      return { success: false };
    }

    const result = await updateTask(taskId, grade as TaskGrade);

    if (result === null) {
      return { success: false, message: `Not found task: ${taskId}` };
    }

    return { success: true };
  },
};
