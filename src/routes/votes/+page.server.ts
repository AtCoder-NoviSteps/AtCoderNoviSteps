import type { PageServerLoad } from './$types';
import {
  getAllTasksWithVoteInfo,
  type TaskWithVoteInfo,
} from '$features/votes/services/vote_statistics';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
  const session = await locals.auth.validate();

  let tasks: TaskWithVoteInfo[] = [];
  let fetchFailed = false;

  try {
    tasks = await getAllTasksWithVoteInfo();
  } catch (error) {
    fetchFailed = true;
    console.error('Failed to load tasks with vote info:', error);
  }

  if (session === null && !fetchFailed) {
    setHeaders({ 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' });
  }

  return {
    tasks,
    isLoggedIn: session !== null,
  };
};
