import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { getTask } from '$lib/services/tasks';
import {
  getVoteGrade,
  getVoteCountersByTaskId,
  getVoteStatsByTaskId,
} from '$features/votes/services/vote_crud';
import { voteAbsoluteGrade } from '$features/votes/actions/vote_actions';
import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = await locals.auth.validate();
  const taskId = params.slug;

  const tasks = await getTask(taskId);
  const task = tasks[0];
  if (!task) throw error(404, 'Task not found');

  // PENDING以外の問題は投票ページの対象外
  if (task.grade !== 'PENDING') redirect(TEMPORARY_REDIRECT, '/votes');

  let myVote = null;
  if (session?.user.userId) {
    myVote = await getVoteGrade(session.user.userId, taskId);
  }

  // 先入観の影響を低減させるため、投票するまで統計情報は表示しない
  let counters = null;
  let stats = null;
  if (myVote?.voted) {
    [counters, stats] = await Promise.all([
      getVoteCountersByTaskId(taskId),
      getVoteStatsByTaskId(taskId),
    ]);
  }

  return {
    task,
    myVote,
    counters,
    stats,
    isLoggedIn: session !== null,
  };
};

export const actions: Actions = {
  voteAbsoluteGrade: async ({ request, locals }) => {
    return await voteAbsoluteGrade({ request, locals }, 'votes/[slug] -> voteAbsoluteGrade');
  },
};
