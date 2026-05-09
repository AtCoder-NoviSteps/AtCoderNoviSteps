import { LOGIN_PAGE } from '$lib/constants/navbar-links';

/**
 * Builds the login path with an optional redirect parameter.
 * @param redirectTo - The decoded path to redirect back to after login; if not provided, returns the base login path
 * @returns The login path with optional redirectTo query parameter
 */
export function buildLoginPath(redirectTo?: string | URL | null): string {
  if (!redirectTo) {
    return LOGIN_PAGE;
  }

  const pathname = redirectTo instanceof URL ? redirectTo.pathname + redirectTo.search : redirectTo;
  return `${LOGIN_PAGE}?redirectTo=${encodeURIComponent(pathname)}`;
}
