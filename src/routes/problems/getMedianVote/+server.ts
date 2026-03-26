import { json, type RequestHandler } from '@sveltejs/kit';
import { getVoteStatsByTaskId } from '$features/votes/services/vote_statistics';
import { getVoteGrade } from '$features/votes/services/vote_grade';

export const GET: RequestHandler = async ({ url, locals }) => {
  const taskId = url.searchParams.get('taskId');
  if (!taskId) return json({ error: 'taskId required' }, { status: 400 });

  const session = await locals.auth.validate();
  if (!session || !session.user || !session.user.userId) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    // Only return vote statistics to users who have already cast a vote for this task.
    const voteRecord = await getVoteGrade(session.user.userId, taskId);
    if (!voteRecord.voted) return json({ grade: null });

    const stats = await getVoteStatsByTaskId(taskId);
    if (stats && stats.grade) return json({ grade: stats.grade });
    return json({ grade: null });
  } catch (err) {
    console.error('getMedianVote failed', err);
    return json({ error: 'internal error' }, { status: 500 });
  }
};
