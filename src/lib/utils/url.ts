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
 * - Cannot start or end with a hyphen
 * - Cannot contain consecutive hyphens
 */
export function isValidUrlSlug(slug: string): boolean {
  const pattern = new RegExp(
    '^[a-z0-9]+(-[a-z0-9]+)*$', // a-z, 0-9, and hyphen (-) allowed
  );

  return !!pattern.test(slug);
}

export function sanitizeUrl(rawUrl: string) {
  return xss(rawUrl);
}
