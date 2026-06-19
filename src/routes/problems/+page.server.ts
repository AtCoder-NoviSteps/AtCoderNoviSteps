import { fail, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import * as task_crud from '$lib/services/task_results';
import { getVoteGradeStatistics } from '$features/votes/services/vote_statistics';
import type { TaskResults } from '$lib/types/task';
import { updateTaskResult } from '$lib/actions/update_task_result';
import { voteAbsoluteGrade } from '@/features/votes/actions/vote_actions';
import { voteAbsoluteGradeSchema } from '$features/votes/zod/schema';
import { BAD_REQUEST } from '$lib/constants/http-response-status-codes';

// 一覧表ページは、ログインしていなくても閲覧できるようにする
export async function load({ locals, url, setHeaders }) {
  const session = await locals.auth.validate();
  const params = await url.searchParams;

  const tagIds: string | null = params.get('tagIds');
  // TODO: utilに移動させる
  const isLoggedIn: boolean = session !== null;

  // Degrade gracefully if vote stats are unavailable — the problems page must remain accessible.
  let voteResults = new Map();
  let voteStatsOk = true;

  try {
    voteResults = await getVoteGradeStatistics();
  } catch (error) {
    voteStatsOk = false;
    console.error('Failed to load vote statistics:', error);
  }

  // Anonymous responses are identical for all users and contain no per-user
  // answer state, so they are safe to cache at the CDN. Logged-in responses
  // are personalized and must never be shared-cached.
  // Skip caching a degraded response (vote stats failed) to avoid pinning a
  // broken page at the edge for the full TTL.
  if (session === null && voteStatsOk) {
    setHeaders({ 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' });
  }

  const taskResults = (
    tagIds
      ? await task_crud.getTasksWithTagIds(tagIds, session?.user.userId)
      : await task_crud.getTaskResults(session?.user.userId)
  ) as TaskResults;

  return {
    taskResults,
    voteResults,
    isLoggedIn: isLoggedIn,
    isAtCoderVerified: locals.user?.is_validated === true,
  };
}

export const actions = {
  update: async ({ request, locals }) => {
    const operationLog = 'problems -> actions -> update';
    return await updateTaskResult({ request, locals }, operationLog);
  },
  voteAbsoluteGrade: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(voteAbsoluteGradeSchema));
    if (!form.valid) {
      return fail(BAD_REQUEST, { form });
    }
    return await voteAbsoluteGrade({ locals, data: form.data });
  },
} satisfies Actions;
