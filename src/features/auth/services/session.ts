import { redirect } from '@sveltejs/kit';

import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

import { buildLoginPath } from '../utils/login';

/**
 * Get the current logged-in user or redirect to login.
 *
 * **Control flow guarantee:** This function either returns a user object or throws redirect().
 * It never returns null — if no session exists, redirect() is thrown before returning.
 * Safe to use with non-null assertion (!) in calling code, as null is unreachable.
 *
 * **Future refactor:** Consider separating into:
 * - getLoggedInUser(locals, url) — current behavior (redirect on no session)
 * - getLoggedInUserOptional(locals) — returns null on no session
 * See GitHub issue #XXXX for discussion.
 *
 * @param locals - The application locals containing auth and user information
 * @param url - The current URL; when provided, appends ?redirectTo= so the user returns after login
 * @returns The logged-in user (never null; redirect is thrown instead)
 * @throws SvelteKit redirect(307, '/login?redirectTo=...') if session does not exist
 */
export const getLoggedInUser = async (
  locals: App.Locals,
  url?: URL,
): Promise<App.Locals['user']> => {
  await ensureSessionOrRedirect(locals, url);
  const loggedInUser = locals.user;

  if (!loggedInUser) {
    redirect(TEMPORARY_REDIRECT, buildLoginPath(url));
  }

  return loggedInUser;
};

/**
 * Ensure user has a valid session or redirect to login
 * @param locals - The application locals containing auth and user information
 * @param url - The current URL; when provided, appends ?redirectTo= so the user returns after login
 */
export const ensureSessionOrRedirect = async (locals: App.Locals, url?: URL): Promise<void> => {
  const session = await locals.auth.validate();

  if (!session) {
    redirect(TEMPORARY_REDIRECT, buildLoginPath(url));
  }
};
