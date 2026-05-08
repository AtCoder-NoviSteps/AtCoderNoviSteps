import { SIGNUP_PAGE } from '$lib/constants/navbar-links';

/**
 * Builds the signup path with an optional redirect parameter.
 * @param redirectTo - The decoded path to redirect back to after signup; if not provided, returns the base signup path
 * @returns The signup path with optional redirectTo query parameter
 */
export function buildSignupPath(redirectTo?: string | URL | null): string {
  if (!redirectTo) {
    return SIGNUP_PAGE;
  }

  const pathname = redirectTo instanceof URL ? redirectTo.pathname + redirectTo.search : redirectTo;
  return `${SIGNUP_PAGE}?redirectTo=${encodeURIComponent(pathname)}`;
}
