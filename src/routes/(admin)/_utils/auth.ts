import { redirect } from '@sveltejs/kit';

import * as userService from '$lib/services/users';

import { Roles } from '$lib/types/user';

import { isAdmin } from '$lib/utils/authorship';

import { LOGIN_PAGE } from '$lib/constants/navbar-links';
import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';

/**
 * Validates that the current session belongs to an admin user.
 * Redirects to the login page if the session is missing or the user is not an admin.
 */
export async function validateAdminAccess(locals: App.Locals): Promise<void> {
  const session = await locals.auth.validate();

  if (!session) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }

  const user = await userService.getUser(session.user.username);

  if (!user || !isAdmin(user.role as Roles)) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }
}
