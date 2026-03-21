import { json, type RequestHandler } from '@sveltejs/kit';
import { getVoteGrade } from '@/features/votes/services/vote_table_manager';

export const GET: RequestHandler = async ({ url, locals }) => {
  const taskId = url.searchParams.get('taskId');
  if (!taskId) return json({ error: 'taskId required' }, { status: 400 });

  const session = await locals.auth.validate();
  if (!session || !session.user || !session.user.userId) return json({ error: 'unauthorized' }, { status: 401 });

  const res = await getVoteGrade(session.user.userId, taskId);
  return json(res);
};