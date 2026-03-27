import type { PageServerLoad } from './$types';
import { getAllTasksWithVoteInfo } from '$features/votes/services/vote_statistics';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  const tasks = await getAllTasksWithVoteInfo();

  return {
    tasks,
    isLoggedIn: session !== null,
  };
};
