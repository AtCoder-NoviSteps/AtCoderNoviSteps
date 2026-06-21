import type { PageServerLoad } from './$types';
import { getAllTasksWithVoteInfo } from '$features/votes/services/vote_statistics';

export const load: PageServerLoad = async ({ locals, setHeaders }) => {
  const session = await locals.auth.validate();

  let tasks: Awaited<ReturnType<typeof getAllTasksWithVoteInfo>> = [];
  let dataOk = true;

  try {
    tasks = await getAllTasksWithVoteInfo();
  } catch (error) {
    dataOk = false;
    console.error('Failed to load tasks with vote info:', error);
  }

  if (session === null && dataOk) {
    setHeaders({ 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' });
  }

  return {
    tasks,
    isLoggedIn: session !== null,
  };
};
