import { fail, redirect } from '@sveltejs/kit';

import { invalidateSession } from '$features/auth/server/session';

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

    await invalidateSession(session.sessionId); // invalidate session
    locals.auth.setSession(null); // remove cookie

    redirect(SEE_OTHER, HOME_PAGE);
  },
};
