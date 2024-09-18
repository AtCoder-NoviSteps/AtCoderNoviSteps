// See:
// https://lucia-auth.com/guidebook/sign-in-with-username-and-password/sveltekit/
import { auth } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

import { SEE_OTHER, UNAUTHORIZED } from '$lib/constants/http-response-status-codes';
import { HOME_PAGE } from '$lib/constants/navbar-links';

import type { Actions } from './$types';

export const load = () => {
  redirect(SEE_OTHER, HOME_PAGE);
};

export const actions: Actions = {
  logout: async ({ locals }) => {
    const session = await locals.auth.validate();

    if (!session) {
      return fail(UNAUTHORIZED);
    }

    await auth.invalidateSession(session.sessionId); // invalidate session
    locals.auth.setSession(null); // remove cookie

    redirect(SEE_OTHER, HOME_PAGE);
  },
};
