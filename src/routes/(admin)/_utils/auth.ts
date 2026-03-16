import { redirect, error } from '@sveltejs/kit';

import * as userService from '$lib/services/users';

import { Roles } from '$lib/types/user';

import { isAdmin } from '$lib/utils/authorship';

import { LOGIN_PAGE } from '$lib/constants/navbar-links';
import {
  TEMPORARY_REDIRECT,
  UNAUTHORIZED,
  FORBIDDEN,
} from '$lib/constants/http-response-status-codes';

enum AdminStatus {
  OK = 'ok',
  UNAUTHENTICATED = 'unauthenticated',
  UNAUTHORIZED = 'unauthorized',
}

/**
 * Validates that the current session belongs to an admin user.
 * Redirects to the login page if the session is missing or the user is not an admin.
 */
export async function validateAdminAccess(locals: App.Locals): Promise<void> {
  if ((await validateAdminStatus(locals)) !== AdminStatus.OK) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }
}

/**
 * Validates admin access for API routes (+server.ts).
 * Throws error(401/403) instead of redirect so fetch() callers receive a proper HTTP status.
 */
export async function validateAdminAccessForApi(locals: App.Locals): Promise<void> {
  const status = await validateAdminStatus(locals);

  if (status === AdminStatus.UNAUTHENTICATED) {
    error(UNAUTHORIZED);
  }

  if (status === AdminStatus.UNAUTHORIZED) {
    error(FORBIDDEN);
  }
}

async function validateAdminStatus(locals: App.Locals): Promise<AdminStatus> {
  const session = await locals.auth.validate();

  if (!session) {
    return AdminStatus.UNAUTHENTICATED;
  }

  const user = await userService.getUser(session.user.username);

  if (!user || !isAdmin(user.role as Roles)) {
    return AdminStatus.UNAUTHORIZED;
  }

  return AdminStatus.OK;
}
