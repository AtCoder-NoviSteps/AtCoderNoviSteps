import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

import { getTask } from '$lib/services/tasks';
import { getVoteGrade } from '$features/votes/services/vote_grade';
import {
  getVoteCountersByTaskId,
  getVoteStatsByTaskId,
} from '$features/votes/services/vote_statistics';
import { voteAbsoluteGrade } from '$features/votes/actions/vote_actions';
import { voteAbsoluteGradeSchema } from '$features/votes/zod/schema';
import { BAD_REQUEST } from '$lib/constants/http-response-status-codes';

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = await locals.auth.validate();
  const taskId = params.slug;

  const tasks = await getTask(taskId);
  const task = tasks[0];
  if (!task) throw error(404, 'Task not found');

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
    isAtCoderVerified: locals.user?.is_validated === true,
  };
};

export const actions: Actions = {
  voteAbsoluteGrade: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(voteAbsoluteGradeSchema));
    if (!form.valid) {
      return fail(BAD_REQUEST, { form });
    }
    return await voteAbsoluteGrade({ locals, data: form.data });
  },
};
