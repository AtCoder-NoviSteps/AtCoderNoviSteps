import xss from 'xss';

export function isValidUrl(rawUrl: string): boolean {
  const pattern = new RegExp(
    '^(?:' + // start
      '(https?:\\/\\/)?' + // protocol (https:// or http://)
      '(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}' + // domain name
      '(\\/[-a-z\\d%_.~+]*)*' + // path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      ')?$', // end
    'i',
  );

  return !!pattern.test(rawUrl);
}

/**
 * Validates if a string is a valid URL slug.
 *
 * @param slug - The string to validate as a URL slug
 * @returns A boolean indicating whether the provided string is a valid URL slug
 *
 * A valid URL slug:
 * - Contains only lowercase letters (a-z), numbers (0-9), and hyphens (-)
 * - Must start with a lowercase letter or number
 * - Must end with a lowercase letter or number
 * - Cannot contain uppercase letters or special characters
 * - Cannot be entirely numeric
 * - Cannot start or end with a hyphen
 * - Cannot contain consecutive hyphens
 */
export function isValidUrlSlug(slug: string): boolean {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return false;
  }

  if (/^\d+$/.test(slug)) {
    return false;
  }

  return true;
}

export function sanitizeUrl(rawUrl: string) {
  return xss(rawUrl);
}

/**
 * Validates if a redirect target is safe (same origin) to prevent open redirect vulnerabilities.
 *
 * @param redirectTarget - The target URL to redirect to (relative or absolute)
 * @param requestOrigin - The origin of the current request (e.g., 'http://localhost:5174')
 * @returns A boolean indicating whether the redirect target is same-origin as the request
 */
export function isSameOriginRedirect(redirectTarget: string, requestOrigin: string): boolean {
  try {
    const targetUrl = new URL(redirectTarget, requestOrigin);
    return targetUrl.origin === requestOrigin;
  } catch {
    return false;
  }
}
