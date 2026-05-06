import { redirect } from '@sveltejs/kit';

import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

import { buildLoginPath } from '../utils/login';

/**
 * Get the current logged-in user or redirect to login
 * @param locals - The application locals containing auth and user information
 * @param url - The current URL; when provided, appends ?redirectTo= so the user returns after login
 * @returns The logged-in user or null
 */
export const getLoggedInUser = async (
  locals: App.Locals,
  url?: URL,
): Promise<App.Locals['user'] | null> => {
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
