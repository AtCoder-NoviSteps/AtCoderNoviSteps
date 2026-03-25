import type { Actions, PageServerLoad } from './$types';

import { type TaskGrade } from '$lib/types/task';
import { getTasksByTaskId, updateTask } from '$lib/services/tasks';
import {
  getAllVoteStatisticsAsArray,
  getAllVoteCounters,
} from '$features/votes/services/vote_statistics';
import { validateAdminAccess } from '../_utils/auth';

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
    const taskId = data.get('taskId');
    const grade = data.get('grade');
    if (typeof taskId !== 'string' || !taskId || typeof grade !== 'string') {
      return { success: false };
    }
    await updateTask(taskId, grade as TaskGrade);
    return { success: true };
  },
};
