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

export function sanitizeUrl(rawUrl: string) {
  return xss(rawUrl);
}
