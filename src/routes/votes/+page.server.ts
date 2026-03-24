import type { PageServerLoad } from './$types';
import * as voteCrud from '$features/votes/services/vote_crud';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  const tasks = await voteCrud.getPendingTasksWithVoteInfo();

  return {
    tasks,
    isLoggedIn: session !== null,
  };
};
