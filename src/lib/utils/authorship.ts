import { redirect } from '@sveltejs/kit';

import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes';
import { Roles } from '$lib/types/user';

/**
 * Ensure user has a valid session or redirect to login
 * @param locals - The application locals containing auth and user information
 * @returns {Promise<void>}
 */
export const ensureSessionOrRedirect = async (locals: App.Locals): Promise<void> => {
  const session = await locals.auth.validate();

  if (!session) {
    redirect(TEMPORARY_REDIRECT, '/login');
  }
};

/**
 * Get the current logged-in user or redirect to login
 * @param locals - The application locals containing auth and user information
 * @returns {Promise<App.Locals['user'] | null>} - The logged-in user or null
 */
export const getLoggedInUser = async (locals: App.Locals): Promise<App.Locals['user'] | null> => {
  await ensureSessionOrRedirect(locals);
  const loggedInUser = locals.user;

  if (!loggedInUser) {
    redirect(TEMPORARY_REDIRECT, '/login');
  }

  return loggedInUser;
};

/**
 * Validate if the user has admin role
 * @param role - User role
 * @returns {boolean} - True if user is admin, false otherwise
 */
export const isAdmin = (role: Roles): boolean => {
  return role === Roles.ADMIN;
};

/**
 * Validate if the user has authority (is the author)
 * @param userId - The user id
 * @param authorId - The author id
 * @returns {boolean} - True if user has authority, false otherwise
 */
export const hasAuthority = (userId: string, authorId: string): boolean => {
  return userId.toLowerCase() === authorId.toLowerCase();
};

/**
 * Validate if user can read the workbook
 * Public workbooks can be read by anyone, private workbooks only by the author
 * @param isPublished - Whether the workbook is published
 * @param userId - The user id
 * @param authorId - The author id
 * @returns {boolean} - True if user can read, false otherwise
 */
export const canRead = (isPublished: boolean, userId: string, authorId: string): boolean => {
  return isPublished || hasAuthority(userId, authorId);
};

/**
 * Validate if user can edit the workbook
 * Authors can always edit their workbooks
 * Admins can edit public workbooks as a special case
 * @param userId - The user id
 * @param authorId - The author id
 * @param role - User role
 * @returns {boolean} - True if user can edit, false otherwise
 */
export const canEdit = (
  userId: string,
  authorId: string,
  role: Roles,
  isPublished: boolean,
): boolean => {
  return hasAuthority(userId, authorId) || (isAdmin(role) && isPublished);
};

/**
 * Validate if user can delete the workbook
 * Only the author can delete their workbooks
 * @param userId - The user id
 * @param authorId - The author id
 * @returns {boolean} - True if user can delete, false otherwise
 */
export const canDelete = (userId: string, authorId: string): boolean => {
  return hasAuthority(userId, authorId);
};
