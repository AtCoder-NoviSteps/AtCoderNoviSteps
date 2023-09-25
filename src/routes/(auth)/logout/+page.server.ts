// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';

export const load = () => {
  throw redirect(303, '/');
};

// TODO: ステータスコードを定数で書き換え
export const actions: Actions = {
  logout: async ({ locals }) => {
    const session = await locals.auth.validate();

    if (!session) {
      return fail(401);
    }

    await auth.invalidateSession(session.sessionId); // invalidate session
    locals.auth.setSession(null); // remove cookie

    throw redirect(303, '/');
  },
};
