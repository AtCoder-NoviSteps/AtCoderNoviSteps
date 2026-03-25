import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { Roles } from '$lib/types/user';
import { type TaskGrade } from '$lib/types/task';
import { isAdmin } from '$lib/utils/authorship';
import { getUser } from '$lib/services/users';
import { getTasksByTaskId, updateTask } from '$lib/services/tasks';
import {
  getAllVoteStatisticsAsArray,
  getAllVoteCounters,
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

  const [allStats, tasksMap, allCounters] = await Promise.all([
    getAllVoteStatisticsAsArray(),
    getTasksByTaskId(),
    getAllVoteCounters(),
  ]);

  const voteTotalsMap = new Map<string, number>();
  for (const counter of allCounters) {
    voteTotalsMap.set(counter.taskId, (voteTotalsMap.get(counter.taskId) ?? 0) + counter.count);
  }

  const statsWithInfo = allStats.map((stat) => {
    const task = tasksMap.get(stat.taskId);
    return {
      taskId: stat.taskId,
      title: task?.title ?? stat.taskId,
      contestId: task?.contest_id ?? '',
      dbGrade: task?.grade ?? 'PENDING',
      estimatedGrade: stat.grade,
      voteTotal: voteTotalsMap.get(stat.taskId) ?? 0,
    };
  });

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
