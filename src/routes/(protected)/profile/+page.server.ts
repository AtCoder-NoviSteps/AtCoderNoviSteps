// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, '/login');
  }

  return {
    userId: session.user.userId,
    username: session.user.username,
  };
};
