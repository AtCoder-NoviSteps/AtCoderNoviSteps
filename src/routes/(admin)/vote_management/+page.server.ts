import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { Roles } from '$lib/types/user';
import { type TaskGrade } from '$lib/types/task';
import { isAdmin } from '$lib/utils/authorship';
import { getUser } from '$lib/services/users';
import { getTasksByTaskId, updateTask } from '$lib/services/tasks';
import {
  getAllVoteStatisticsAsArray,
  getVoteCountersByTaskId,
} from '$features/votes/services/vote_crud';
import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';
import { LOGIN_PAGE } from '$lib/constants/navbar-links';

async function validateAdminAccess(locals: App.Locals): Promise<void> {
  const session = await locals.auth.validate();
  if (!session) redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);

  const user = await getUser(session.user.username as string);
  if (!isAdmin(user?.role as Roles)) redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
}

export const load: PageServerLoad = async ({ locals }) => {
  await validateAdminAccess(locals);

  const [allStats, tasksMap] = await Promise.all([
    getAllVoteStatisticsAsArray(),
    getTasksByTaskId(),
  ]);

  // 各タスクの投票総数を取得
  const statsWithInfo = await Promise.all(
    allStats.map(async (stat) => {
      const task = tasksMap.get(stat.taskId);
      const counters = await getVoteCountersByTaskId(stat.taskId);
      const voteTotal = counters.reduce((sum, c) => sum + c.count, 0);
      return {
        taskId: stat.taskId,
        title: task?.title ?? stat.taskId,
        contestId: task?.contest_id ?? '',
        dbGrade: task?.grade ?? 'PENDING',
        estimatedGrade: stat.grade,
        voteTotal,
      };
    }),
  );

  return { stats: statsWithInfo };
};

export const actions: Actions = {
  setTaskGrade: async ({ request, locals }) => {
    await validateAdminAccess(locals);
    const data = await request.formData();
    const taskId = data.get('taskId') as string;
    const grade = data.get('grade') as TaskGrade;
    await updateTask(taskId, grade);
    return { success: true };
  },
};
