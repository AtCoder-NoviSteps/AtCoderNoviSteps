import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/database';

export const GET: RequestHandler = async ({ url }) => {
  const taskId = url.searchParams.get('taskId');
  if (!taskId) return json({ error: 'taskId required' }, { status: 400 });

  try {
    const stats = await prisma.votedGradeStatistics.findFirst({ where: { taskId } });
    if (stats && stats.grade) return json({ grade: stats.grade });
    return json({ grade: null });
  } catch (err) {
    console.error('getMedianVote failed', err);
    return json({ error: 'internal error' }, { status: 500 });
  }
};
